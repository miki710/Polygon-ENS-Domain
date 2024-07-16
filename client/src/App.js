import React, { useEffect, useState } from "react";
import "./styles/App.css";
import xLogo from "./assets/x-logo.svg";
import { ethers } from "ethers";
import contractAbi from "./utils/contractABI.json";
import polygonLogo from './assets/polygonlogo.png';
import ethLogo from './assets/ethlogo.png';
import { networks } from './utils/networks';
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Admin from "./Admin";

// 定数
const tld = ".ninja";
const CONTRACT_ADDRESS = "0x674Eed763c9d01E0f30784410382efBba5D43b12";

const X_HANDLE = "UNCHAIN_tech";
const X_LINK = `https://x.com/${X_HANDLE}`;

const App = () => {
  const [currentAccount, setCurrentAccount] = useState(null);
  const [domain, setDomain] = useState("");
  const [record, setRecord] = useState("");
  const [network, setNetwork] = useState('');
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mints, setMints] = useState([]);
  const [isOwner, setIsOwner] = useState(false); // isOwnerを定義

  // ネットワークが変わったらリロードします。
  function handleChainChanged(_chainId) {
    console.log("Chain ID:", _chainId); // チェーンIDをログに出力
    setNetwork(networks[_chainId] || "Unknown Network");
  }

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

    // ユーザーのネットワークのチェーンIDをチェックします。
    const chainId = await ethereum.request({ method: 'eth_chainId' });
    setNetwork(networks[chainId]);

    ethereum.on('chainChanged', handleChainChanged);

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
      domain.length === 3 ? "0.005" : domain.length === 4 ? "0.003" : "0.001";
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
          
          // fetchMints関数実行後2秒待ちます。
          setTimeout(() => {
            fetchMints();
          }, 2000);

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

  // mintDomain関数のあとに追加するのがわかりやすいでしょう。
  const fetchMints = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        // もう理解できていますね。
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(
          CONTRACT_ADDRESS,
          contractAbi.abi,
          signer
        );

        // すべてのドメインを取得します。
        const names = await contract.getAllNames();

        // ネームごとにレコードを取得します。マッピングの対応を理解しましょう。
        const mintRecords = await Promise.all(
          names.map(async (name) => {
            const mintRecord = await contract.records(name);
            const owner = await contract.domains(name);
            return {
              id: names.indexOf(name),
              name: name,
              record: mintRecord,
              owner: owner,
            };
          })
        );

        console.log("MINTS FETCHED ", mintRecords);
        setMints(mintRecords);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const updateDomain = async () => {
    if (!record || !domain) {
      return;
    }
    setLoading(true);
    console.log("Updating domain", domain, "with record", record);
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
  
        let tx = await contract.setRecord(domain, record);
        await tx.wait();
        console.log("Record set https://amoy.polygonscan.com/tx/" + tx.hash);
  
        fetchMints();
        setRecord("");
        setDomain("");
      }
    } catch (error) {
      console.log(error);
    }
    setLoading(false);
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

  const switchNetwork = async () => {
    if (window.ethereum) {
      try {
        // Amoy testnet に切り替えます。
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0x13882" }], // utilsフォルダ内のnetworks.js を確認しましょう。0xは16進数です。
        });
      } catch (error) {
        // このエラーコードは当該チェーンがメタマスクに追加されていない場合です。
        // その場合、ユーザーに追加するよう促します。
        if (error.code === 4902) {
          try {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: "0x13882",
                  chainName: "Polygon Amoy Testnet",
                  rpcUrls: ["https://rpc-amoy.maticvigil.com/"],
                  nativeCurrency: {
                    name: "Amoy Matic",
                    symbol: "MATIC",
                    decimals: 18,
                  },
                  blockExplorerUrls: ["https://amoy.polygonscan.com/"],
                },
              ],
            });
          } catch (error) {
            console.log(error);
          }
        }
        console.log(error);
      }
    } else {
      // window.ethereum が見つからない場合メタマスクのインストールを促します。
      alert(
        "MetaMask is not installed. Please install it to use this app: https://metamask.io/download.html"
      );
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
    // テストネットの Polygon Amoy 上にいない場合の処理
    if (!network || network.toLowerCase() !== 'polygon amoy testnet') {
      return (
        <div className="connect-wallet-container">
          <p>Please connect to the Polygon Amoy Testnet</p>
          {/* 今ボタンで switchNetwork 関数を呼び出します。 */}
          <button className='cta-button mint-button' onClick={switchNetwork}>Click here to switch</button>
        </div>
      );
    }
    
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
          {/* editing 変数が true の場合、"Set record" と "Cancel" ボタンを表示します。 */}
          {editing ? (
            <div className="button-container">
              {/* updateDomain関数を呼び出します。 */}
              <button className='cta-button mint-button' disabled={loading} onClick={updateDomain}>
                Set record
              </button>
              {/* editing を false にしてEditモードから抜けます。*/}
              <button className='cta-button mint-button' onClick={() => {setEditing(false)}}>
                Cancel
              </button>
            </div>
          ) : (
            // editing 変数が true でない場合、Mint ボタンが代わりに表示されます。
            <button className='cta-button mint-button' disabled={loading} onClick={mintDomain}>
              Mint
            </button>
          )}
      </div>
    );
  };

  // 他のレンダリング関数の次に追加しましょう。
const renderMints = () => {
  if (currentAccount && mints.length > 0) {
    return (
      <div className="mint-container">
        <p className="subtitle"> Recently minted domains!</p>
        <div className="mint-list">
          {mints.map((mint, index) => {
            return (
              <div className="mint-item" key={index}>
                <div className="mint-row">
                  <a
                    className="link"
                    href={`https://testnets.opensea.io/assets/amoy/${CONTRACT_ADDRESS}/${mint.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <p className="underlined">
                      {" "}
                      {mint.name}
                      {tld}{" "}
                    </p>
                  </a>
                  {/* mint.owner が currentAccount なら edit ボタンを追加します。 */}
                  {mint.owner.toLowerCase() === currentAccount.toLowerCase() ? (
                    <button
                      className="edit-button"
                      onClick={() => editRecord(mint.name)}
                    >
                      <img
                        className="edit-icon"
                        src="https://img.icons8.com/metro/26/000000/pencil.png"
                        alt="Edit button"
                      />
                    </button>
                  ) : null}
                </div>
                <p> {mint.record} </p>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
};

// edit モードを設定します。
const editRecord = (name) => {
  console.log("Editing record for", name);
  setEditing(true);
  setDomain(name);
};

  // ページがリロードされると呼び出されます。
  useEffect(() => {
    checkIfWalletIsConnected();
    // ネットワークの状態を取得する関数を追加
    const { ethereum } = window;
    if (ethereum) {
      ethereum.on('chainChanged', handleChainChanged);
      ethereum.request({ method: 'eth_chainId' }).then(handleChainChanged);
    }
  }, [checkIfWalletIsConnected]);

  useEffect(() => {
    console.log("Current Account:", currentAccount);
    const checkOwner = async () => {
      if (!currentAccount) return;

      try {
        const { ethereum } = window;

        if (ethereum) {
          const provider = new ethers.providers.Web3Provider(ethereum);
          const signer = provider.getSigner();
          const contract = new ethers.Contract(CONTRACT_ADDRESS, contractAbi.abi, signer);

          const owner = await contract.owner();
          console.log("Contract Owner:", owner);
          setIsOwner(owner.toLowerCase() === currentAccount.toLowerCase());
          console.log("Is Owner:", owner.toLowerCase() === currentAccount.toLowerCase());
        }
      } catch (error) {
        console.log("Error checking owner:", error);
      }
    };

    checkOwner();
  }, [currentAccount]);

  // currentAccount, network が変わるたびに実行されます。
  useEffect(() => {
    if (network === "Polygon Amoy Testnet") {
      fetchMints();
    }
  }, [currentAccount, network]);

  return (
    <Router>
    <div className="App">
      <div className="container">
        <div className="header-container">
          <header>
            <div className="left">
              <p className="title">🐱‍👤 Ninja Name Service</p>
              <p className="subtitle">Your immortal API on the blockchain!</p>
            </div>
             {/* Display a logo and wallet connection status*/}
            <div className="right">
              <img alt="Network logo" className="logo" src={ network && network.includes('Polygon') ? polygonLogo : ethLogo} /> 
              { currentAccount ?
                <p>Wallet: {currentAccount.slice(0, 6)}...{currentAccount.slice(-4)}</p>
              :
              <p>Not connected</p>
              }
            </div>
          </header>
        </div>

        <Routes>
            <Route path="/admin" element={<Admin currentAccount={currentAccount} />} />
            <Route path="/" element={
              <>
                {!currentAccount && renderNotConnectedContainer()}
                {currentAccount && renderInputForm()}
                {currentAccount && renderMints()}
              </>
            } />
        </Routes>

        <div className="footer-container">
          <div className="x-container">
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
          {isOwner && (
              <Link to="/admin" className="admin-link">Admin</Link>
          )}
        </div>
      </div>
    </div>
    </Router>
  );
};

export default App;