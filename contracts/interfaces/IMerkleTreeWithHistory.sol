// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IMerkleTreeWithHistory
 * @dev Interface for the MerkleTreeWithHistory contract
 */
interface IMerkleTreeWithHistory {
    /**
     * @dev Insert a new leaf into the Merkle tree
     * @param _leaf Leaf to insert
     * @return Index of the inserted leaf
     */
    function insert(bytes32 _leaf) external returns (uint256);
    
    /**
     * @dev Get the current root of the Merkle tree
     * @return Current root
     */
    function getLastRoot() external view returns (bytes32);
    
    /**
     * @dev Check if a root exists in the history
     * @param _root Root to check
     * @return True if the root exists
     */
    function isKnownRoot(bytes32 _root) external view returns (bool);
} 