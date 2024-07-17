const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

const DomainsModule = buildModule("DomainsModule", (m) => {
    const tld = "ninja"; // ここでTLDを"ninja"に指定します
    const domains3 = m.contract("Domains3", [tld]);

    return { domains3 };
});

module.exports = DomainsModule;