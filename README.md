# CAPSTONE PROJECT

## Requirements - NFT Marketplace with Fractional Royalties

* Objective: Develop a digital asset marketplace that automatically distributes sales revenue to multiple stakeholders upon every trade.
* Technical Requirements:
	* Advanced ERC-721: Extend the standard NFT contract to support EIP-2981 (Royalty Standard) with a custom multi-receiver array.
	* Payment Splitter: Implement a "Pull-payment" pattern (claim-based) to ensure the contract is secure against Reentrancy and "Out of Gas" errors when distributing funds to many creators.
	* Atomic Swaps: Ensure that the transfer of the NFT and the distribution of funds (including royalties) occur in a single atomic transaction.