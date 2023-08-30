import {decryptWithGCM} from './crypto';
import {ethers, randomBytes} from "ethers";
import {henesisWalletABI} from "./abi/henesisWallet";
import * as reader from "readline-sync";
import {ERC20ABI} from "./abi/erc20";
import {concatUint8Arrays} from "./util";

const zeroAddress: string = "0x0000000000000000000000000000000000000000";

async function main() {
    const nodeUrl = reader.question(`복구에 사용할 node url을 입력해주세요 : `)
    const gasPK = reader.question(`복구에 사용할 가스비 지불 PK를 입력해주세요 : `)
    const receiverAddress = reader.question(`복구후 토큰을 수령 받을 주소를 입력해주세요 : `)
    const walletAddress = reader.question(`복구할 지갑주소를 입력해주세요 : `)

    const provider: ethers.JsonRpcProvider = new ethers.JsonRpcProvider(nodeUrl);
    const contract = new ethers.Contract(walletAddress, henesisWalletABI, provider);
    const threshold: number = await contract.getThreshold();
    console.log(`\n\n입력한 지갑의 threshold 는 ${threshold} 입니다.`);
    console.log(`${threshold} 개의 서명자의 복구키트가 필요합니다.\n\n`);

    const withdrawTokenAddress = reader.question(`출금할 토큰의 주소를 입력해주세요 (네이티브의 경우 0x0000000000000000000000000000000000000000) : `)

    const privateKeyList: string[] = [];
    for (let i = 1; i <= threshold; i++) {
        const jsonData = JSON.parse(reader.question(`${i} 번째 비상키트의 암호화된 서명 키를 입력해주세요 ( {} 포함해서 전체 ) : `))
        const iv = jsonData.iv
        const encryptedPk = jsonData.encryptedSigningPrivateKey
        const salt = jsonData.salt
        const signingPassword = reader.question(`${i} 번째 비상키트의 서명 비밀번호를 입력해주세요 : `)
        try {
            let decryptedPrivateKey = await decryptWithGCM(
                new Uint8Array(Buffer.from(encryptedPk, 'hex')),
                signingPassword,
                Buffer.from(salt, 'hex'),
                Buffer.from(iv, 'hex')
            );
            let hexPk = Buffer.from(decryptedPrivateKey).toString('hex');
            if (hexPk.length != 64) {
                throw new Error("복구된 pk가 잘못되었습니다. 비상키트의 암호화된 서명비밀번호, 솔트, 서명비밀번호를 확인해주세요.")
            }
            privateKeyList.push(hexPk)
            console.log(hexPk)
        } catch (e) {
            throw new Error(`PK를 복구할 수 없습니다. 에러 : ${e}`)
        }
    }

    let value = "0x0"
    let data = "0x"
    let to = receiverAddress;
    if (withdrawTokenAddress == zeroAddress) {
        value = (await provider.getBalance(walletAddress)).toString(10)
    } else {
        const erc20Contract = new ethers.Contract(withdrawTokenAddress, ERC20ABI, provider);
        const erc20Amount = await erc20Contract.balanceOf(walletAddress);
        data = await erc20Contract.transfer(receiverAddress, erc20Amount)
        to = withdrawTokenAddress;

    }
    const txParams = [
        to,
        value, // value
        data, // data
        "0x0", // operation
        "0x0", // safeTxGas
        "0x0", // baseGas
        "0x0", // gasPrice
        zeroAddress, // gasToken
        zeroAddress, // refund receiver
        `0x${Buffer.from(randomBytes(32)).toString('hex')}` // nonce
    ]
    let hash = await contract.getTransactionHash(txParams)
    let signatures = []
    for (const pk of privateKeyList) {
        const signer = new ethers.Wallet(pk);
        const signedData = await signer.signMessage(
            ethers.getBytes(hash)
        );
        const signatureV = parseInt(signedData.slice(-2), 16) + 4;
        const finalSignedData = signedData.slice(0, -2) + signatureV.toString(16);
        signatures.push(finalSignedData)
    }
    let signatureBytes = concatUint8Arrays(signatures.map((s) => {
        return ethers.getBytes(s)
    }))
    let connectedContract = new ethers.Contract(walletAddress, henesisWalletABI, new ethers.Wallet(gasPK, provider));
    let b = await connectedContract.execTransaction(txParams, signatureBytes)
    console.log(`[성공] tx hash : ${b.hash}`)

}


main().catch(console.log)
