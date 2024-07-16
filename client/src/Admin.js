import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { useNavigate } from "react-router-dom"; // useNavigateフックをインポート

import contractAbi from "./utils/contractABI.json";

const CONTRACT_ADDRESS = "0x674Eed763c9d01E0f30784410382efBba5D43b12";

const Admin = ({ currentAccount }) => {
  const [, setIsOwner] = useState(false);
  const [contractBalance, setContractBalance] = useState("0");
  const navigate = useNavigate(); // useNavigateフックを使用

  useEffect(() => {
    console.log("Admin Current Account:", currentAccount);
    const checkOwner = async () => {
      if (!currentAccount) return;

      try {
        const { ethereum } = window;

        if (ethereum) {
          const provider = new ethers.providers.Web3Provider(ethereum);
          const signer = provider.getSigner();
          const contract = new ethers.Contract(CONTRACT_ADDRESS, contractAbi.abi, signer);

          const owner = await contract.owner();
          console.log("Admin Contract Owner:", owner);
          setIsOwner(owner.toLowerCase() === currentAccount.toLowerCase());
          console.log("Admin Is Owner:", owner.toLowerCase() === currentAccount.toLowerCase());
        }
      } catch (error) {
        console.log("Error checking owner:", error);
      }
    };

    checkOwner();
  }, [currentAccount]);

  useEffect(() => {
    const getContractBalance = async () => {
      try {
        const { ethereum } = window;

        if (ethereum) {
          const provider = new ethers.providers.Web3Provider(ethereum);
          const balance = await provider.getBalance(CONTRACT_ADDRESS);
          setContractBalance(ethers.utils.formatEther(balance));
        }
      } catch (error) {
        console.log("Error getting contract balance:", error);
      }
    };

    getContractBalance();
  }, []);

  const withdrawFunds = async () => {
    if (!currentAccount) {
      console.log("No account connected");
      return;
    }

    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(CONTRACT_ADDRESS, contractAbi.abi, signer);

        console.log("Withdrawing funds...");
        const tx = await contract.withdraw();
        await tx.wait();
        console.log("Funds withdrawn successfully");
      }
    } catch (error) {
      console.log("Error withdrawing funds:", error);
    }
  };

  return (
    <div>
        <h2>Admin Page</h2>
        <p>Contract Balance: {contractBalance} MATIC</p>
        <div className="admin-button-container"> {/* ボタンを囲むdivを追加 */}
            <button className='admin-button' onClick={withdrawFunds}>Withdraw Funds</button>
            <button className='admin-botton' onClick={() => navigate("/")}>Back to Home</button> {/* 戻るボタンを追加 */}
        </div>
    </div>
  );
};

export default Admin;