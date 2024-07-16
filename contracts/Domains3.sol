// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

// 最初にOpenZeppelinライブラリをインポートします.
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Base64.sol";

import "hardhat/console.sol";

// インポートしたコントラクトを継承します。継承したコントラクトのメソッドを使用できるようになります。
contract Domains3 is ERC721URIStorage {
    uint256 private _nextTokenId;
    string public tld;
    address payable public owner;

    // 追加: namesマッピング
    mapping(uint => string) public names;


    // NFTのイメージ画像をSVG形式でオンチェーンに保存します。
    string svgPartOne =
        '<svg xmlns="http://www.w3.org/2000/svg" width="270" height="270" fill="none"><path fill="url(#B)" d="M0 0h270v270H0z"/><defs><filter id="A" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse" height="270" width="270"><feDropShadow dx="0" dy="1" stdDeviation="2" flood-opacity=".225" width="200%" height="200%"/></filter></defs><path d="M72.863 42.949c-.668-.387-1.426-.59-2.197-.59s-1.529.204-2.197.59l-10.081 6.032-6.85 3.934-10.081 6.032c-.668.387-1.426.59-2.197.59s-1.529-.204-2.197-.59l-8.013-4.721a4.52 4.52 0 0 1-1.589-1.616c-.384-.665-.594-1.418-.608-2.187v-9.31c-.013-.775.185-1.538.572-2.208a4.25 4.25 0 0 1 1.625-1.595l7.884-4.59c.668-.387 1.426-.59 2.197-.59s1.529.204 2.197.59l7.884 4.59a4.52 4.52 0 0 1 1.589 1.616c.384.665.594 1.418.608 2.187v6.032l6.85-4.065v-6.032c.013-.775-.185-1.538-.572-2.208a4.25 4.25 0 0 0-1.625-1.595L41.456 24.59c-.668-.387-1.426-.59-2.197-.59s-1.529.204-2.197.59l-14.864 8.655a4.25 4.25 0 0 0-1.625 1.595c-.387.67-.585 1.434-.572 2.208v17.441c-.013.775.185 1.538.572 2.208a4.25 4.25 0 0 0 1.625 1.595l14.864 8.655c.668.387 1.426.59 2.197.59s1.529-.204 2.197-.59l10.081-5.901 6.85-4.065 10.081-5.901c.668-.387 1.426-.59 2.197-.59s1.529.204 2.197.59l7.884 4.59a4.52 4.52 0 0 1 1.589 1.616c.384.665.594 1.418.608 2.187v9.311c.013.775-.185 1.538-.572 2.208a4.25 4.25 0 0 1-1.625 1.595l-7.884 4.721c-.668.387-1.426.59-2.197.59s-1.529-.204-2.197-.59l-7.884-4.59a4.52 4.52 0 0 1-1.589-1.616c-.385-.665-.594-1.418-.608-2.187v-6.032l-6.85 4.065v6.032c-.013.775.185 1.538.572 2.208a4.25 4.25 0 0 0 1.625 1.595l14.864 8.655c.668.387 1.426.59 2.197.59s1.529-.204 2.197-.59l14.864-8.655c.657-.394 1.204-.95 1.589-1.616s.594-1.418.609-2.187V55.538c.013-.775-.185-1.538-.572-2.208a4.25 4.25 0 0 0-1.625-1.595l-14.993-8.786z" fill="#fff"/><defs><linearGradient id="B" x1="0" y1="0" x2="270" y2="270" gradientUnits="userSpaceOnUse"><stop stop-color="#cb5eee"/><stop offset="1" stop-color="#0cd7e4" stop-opacity=".99"/></linearGradient></defs><text x="32.5" y="231" font-size="27" fill="#fff" filter="url(#A)" font-family="Plus Jakarta Sans,DejaVu Sans,Noto Color Emoji,Apple Color Emoji,sans-serif" font-weight="bold">';
    string svgPartTwo = "</text></svg>";

    mapping(string => address) public domains;
    mapping(string => string) public records;

    // 追加: エラー定義
    error Unauthorized();
    error AlreadyRegistered();
    error InvalidName(string name);

    constructor(
        string memory _tld
    ) payable ERC721("Ninja Name Service", "NNS") {
        tld = _tld;
        owner = payable(msg.sender);
        console.log("%s name service deployed", _tld);
        _nextTokenId = 0; // 初期化
    }

    // onlyOwnerモディファイア
    modifier onlyOwner() {
        require(isOwner(), "You aren't the owner");
        _;
    }

    // isOwner関数
    function isOwner() public view returns (bool) {
        return msg.sender == owner;
    }

    // withdraw関数
    function withdraw() public onlyOwner {
        uint amount = address(this).balance;

        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Failed to withdraw Matic");
    }

    // domainの長さにより価格が変わります。
    function price(string calldata name) public pure returns (uint) {
        uint len = strlen(name);
        require(len > 0);
        if (len == 3) {
            // 3文字のドメインの場合 (通常,ドメインは3文字以上とされます。あとのセクションで触れます。)
            return 0.005 * 10 ** 18; // 5 MATIC = 5 000 000 000 000 000 000 (18ケタ).あとでfaucetから少量もらう関係 0.005MATIC。
        } else if (len == 4) {
            //4文字のドメインの場合
            return 0.003 * 10 ** 18; // 0.003MATIC
        } else {
            return 0.001 * 10 ** 18; // 0.001MATIC
        }
    }

    function register(string calldata name) public payable {
        if (domains[name] != address(0)) revert AlreadyRegistered();
        if (!valid(name)) revert InvalidName(name);

        uint256 _price = price(name);
        require(msg.value >= _price, "Not enough amount paid");

        // ネームとTLD(トップレベルドメイン)を結合します。
        string memory _name = string(abi.encodePacked(name, ".", tld));
        // NFT用にSVGイメージを作成します。
        string memory finalSvg = string(
            abi.encodePacked(svgPartOne, _name, svgPartTwo)
        );
        uint256 newRecordId = _nextTokenId;
        uint256 length = strlen(name);
        string memory strLen = Strings.toString(length);

        console.log(
            "Registering %s.%s on the contract with tokenID %d",
            name,
            tld,
            newRecordId
        );

        // JSON形式のNFTのメタデータを作成。文字列を結合しbase64でエンコードします。
        string memory json = Base64.encode(
            abi.encodePacked(
                '{"name": "',
                _name,
                '", "description": "A domain on the Ninja name service", "image": "data:image/svg+xml;base64,',
                Base64.encode(bytes(finalSvg)),
                '","length":"',
                strLen,
                '"}'
            )
        );

        string memory finalTokenUri = string(
            abi.encodePacked("data:application/json;base64,", json)
        );

        console.log(
            "\n--------------------------------------------------------"
        );
        console.log("Final tokenURI", finalTokenUri);
        console.log(
            "--------------------------------------------------------\n"
        );

        _safeMint(msg.sender, newRecordId);
        _setTokenURI(newRecordId, finalTokenUri);
        domains[name] = msg.sender;

        // 追加: namesマッピングに新しいドメイン名を追加
        names[newRecordId] = name;

        _nextTokenId += 1;
    }

    // 追加: getAllNames関数
    function getAllNames() public view returns (string[] memory) {
        string[] memory allNames = new string[](_nextTokenId);
        for (uint i = 0; i < _nextTokenId; i++) {
            allNames[i] = names[i];
        }

        return allNames;
    }

    // 追加: valid関数
    function valid(string calldata name) public pure returns (bool) {
        return strlen(name) >= 3 && strlen(name) <= 10;
    }

    // price, getAddress, setRecord, getRecord などのfunction は変更しません。
    // nameに対応するaddressを返すゲッター関数を定義しておきます。
    function getAddress(string calldata name) public view returns (address) {
        return domains[name];
    }

    function setRecord(string calldata name, string calldata record) public {
        // トランザクションの送信者であることを確認しています。
        if (msg.sender != domains[name]) revert Unauthorized();
        records[name] = record;
    }

    function getRecord(
        string calldata name
    ) public view returns (string memory) {
        return records[name];
    }

    // 文字列の長さを計算する関数を追加
    function strlen(string memory s) internal pure returns (uint256) {
        uint256 len;
        uint256 i = 0;
        uint256 bytelength = bytes(s).length;
        for (len = 0; i < bytelength; len++) {
            bytes1 b = bytes(s)[i];
            if (b < 0x80) {
                i += 1;
            } else if (b < 0xE0) {
                i += 2;
            } else if (b < 0xF0) {
                i += 3;
            } else if (b < 0xF8) {
                i += 4;
            } else if (b < 0xFC) {
                i += 5;
            } else {
                i += 6;
            }
        }
        return len;
    }
}