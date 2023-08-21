export const henesisWalletABI = [
    "function getThreshold() public view returns (uint256)",
    "function getOwners() public view returns (address[] memory)",
    "function execTransaction(tuple(address to, uint256 value, bytes data, uint8 operation, uint256 safeTxGas, uint256 baseGas, uint256 gasPrice, address gasToken, address payable refundReceiver, uint256 nonce) params, bytes memory signatures) public payable returns (bool success)",
    "function getTransactionHash(tuple(address to, uint256 value, bytes data, uint8 operation, uint256 safeTxGas, uint256 baseGas, uint256 gasPrice, address gasToken, address payable refundReceiver, uint256 nonce) params) public view returns (bytes32)"
];
