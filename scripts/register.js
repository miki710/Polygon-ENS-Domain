const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    const contractAddress = "0x0DcEF2759CA0c0E5174a5d3B40d01737C39fd65D"; // デプロイされたアドレスを使用
    const Domains = await ethers.getContractAt("Domains", contractAddress);

    const domain = "example"; // 登録するドメイン名

    // ドメインの長さに応じて価格を計算
    const price =
      domain.length === 3 ? "0.05" : domain.length === 4 ? "0.03" : "0.01";
    console.log("Minting domain", domain, "with price", price);

    // ドメインを登録
    const tx = await Domains.register(domain, { value: ethers.utils.parseEther(price) });
    await tx.wait();

    // レコードをセット
    const recordTx = await Domains.setRecord(domain, "My ninja power is stealth");
    await recordTx.wait();

    // トークンIDを取得
    const nextTokenId = await Domains.getNextTokenId();
    const tokenId = nextTokenId.sub(1);
    console.log("Token ID:", tokenId.toString());

    // tokenURIを取得
    const tokenURI = await Domains.tokenURI(tokenId);
    console.log("Token URI:", tokenURI);

    // レコードを取得
    const record = await Domains.records(domain);
    console.log("Record:", record);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });