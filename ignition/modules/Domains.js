const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

const DomainsModule = buildModule("DomainsModule", (m) => {
    const tld = "ninja"; // ここでTLDを"ninja"に指定します
    const domains = m.contract("Domains", [tld]);

    return { domains };
});

module.exports = DomainsModule;