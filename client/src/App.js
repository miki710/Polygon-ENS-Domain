import React, { useEffect, useState } from "react";
import "./styles/App.css";
import xLogo from "./assets/x-logo.svg";
import { ethers } from "ethers";
import contractAbi from "./utils/contractABI.json";

// 定数
const tld = ".ninja";
const CONTRACT_ADDRESS = "0x0DcEF2759CA0c0E5174a5d3B40d01737C39fd65D";

const X_HANDLE = "UNCHAIN_tech";
const X_LINK = `https://x.com/${X_HANDLE}`;

const App = () => {
  const [currentAccount, setCurrentAccount] = useState(null);
  // state管理するプロパティを追加しています。
  const [domain, setDomain] = useState("");
  const [record, setRecord] = useState("");

  // ウォレットの接続を確認します。
  const checkIfWalletIsConnected = async () => {
    const { ethereum } = window;

    if (!ethereum) {
      console.log("Make sure you have MetaMask!");
      return;
    } else {
      console.log("We have the ethereum object", ethereum);
    }

    const accounts = await ethereum.request({ method: "eth_accounts" });

    if (accounts.length !== 0) {
      const account = accounts[0];
      console.log("Found an authorized account:", account);
      setCurrentAccount(account);
    } else {
      console.log("No authorized account found");
    }
  };

  const mintDomain = async () => {
    // ドメインがnullのときrunしません。
    if (!domain) {
      return;
    }
    // ドメインが3文字に満たない、短すぎる場合にアラートを出します。
    if (domain.length < 3) {
      alert("Domain must be at least 3 characters long");
      return;
    }
    // ドメインの文字数に応じて価格を計算します。
    // 3 chars = 0.05 MATIC, 4 chars = 0.03 MATIC, 5 or more = 0.01 MATIC
    const price =
      domain.length === 3 ? "0.05" : domain.length === 4 ? "0.03" : "0.01";
    console.log("Minting domain", domain, "with price", price);
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(
          CONTRACT_ADDRESS,
          contractAbi.abi,
          signer
        );
  
        console.log("Going to pop wallet now to pay gas...");
        let tx = await contract.register(domain, {
          value: ethers.utils.parseEther(price),
        });
        // ミントされるまでトランザクションを待ちます。
        const receipt = await tx.wait();
  
        // トランザクションが問題なく実行されたか確認します。
        if (receipt.status === 1) {
          console.log(
            "Domain minted! https://amoy.polygonscan.com/tx/" + tx.hash
          );
  
          // domain,recordをセットします。
          tx = await contract.setRecord(domain, record);
          await tx.wait();
  
          console.log("Record set! https://amoy.polygonscan.com/tx/" + tx.hash);
  
          setRecord("");
          setDomain("");
        } else {
          alert("Transaction failed! Please try again");
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  // ウォレット接続の関数
  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask -> https://metamask.io/");
        return;
      }

      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });

      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.log(error);
    }
  };

  // まだウォレットに接続されていない場合のレンダリングです。
  const renderNotConnectedContainer = () => (
    <div className="connect-wallet-container">
      <img
        src="https://media.giphy.com/media/3ohhwytHcusSCXXOUg/giphy.gif"
        alt="Ninja gif"
      />
      <button
        className="cta-button connect-wallet-button"
        onClick={connectWallet}
      >
        Connect Wallet
      </button>
    </div>
  );

  // ドメインネームとデータの入力フォームです。
  const renderInputForm = () => {
    return (
      <div className="form-container">
        <div className="first-row">
          <input
            type="text"
            value={domain}
            placeholder="domain"
            onChange={(e) => setDomain(e.target.value)}
          />
          <p className="tld"> {tld} </p>
        </div>

        <input
          type="text"
          value={record}
          placeholder="whats ur ninja power?"
          onChange={(e) => setRecord(e.target.value)}
        />

        <div className="button-container">
          {/* ボタンクリックで mintDomain関数 を呼び出します。 */}
          <button className="cta-button mint-button" onClick={mintDomain}>
            Mint
          </button>
        </div>
      </div>
    );
  };

  // ページがリロードされると呼び出されます。
  useEffect(() => {
    checkIfWalletIsConnected();
  }, []);

  return (
    <div className="App">
      <div className="container">
        <div className="header-container">
          <header>
            <div className="left">
              <p className="title">🐱‍👤 Ninja Name Service</p>
              <p className="subtitle">Your immortal API on the blockchain!</p>
            </div>
          </header>
        </div>

        {/* ウォレットが接続されていない場合に表示 */}
        {!currentAccount && renderNotConnectedContainer()}
        {/* アカウントが接続されるとインプットフォームをレンダリングします。 */}
        {currentAccount && renderInputForm()}

        <div className="footer-container">
          <img alt="X Logo" className="x-logo" src={xLogo} />
          <a
            className="footer-text"
            href={X_LINK}
            target="_blank"
            rel="noreferrer"
          >
            {`built with @${X_HANDLE}`}
          </a>
        </div>
      </div>
    </div>
  );
};

export default App;