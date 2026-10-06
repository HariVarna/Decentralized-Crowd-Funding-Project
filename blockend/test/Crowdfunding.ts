import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.create();

describe("Crowdfunding - Admin Identity (Phase 1)", function () {
  async function deployCrowdfundingFixture() {
    const [deployer, otherAccount, newAdmin] = await ethers.getSigners();
    const crowdfunding = await ethers.deployContract("Crowdfunding");
    return { crowdfunding, deployer, otherAccount, newAdmin };
  }

  describe("Deployment & Initial Ownership", function () {
    it("Should deploy successfully", async function () {
      const { crowdfunding } = await deployCrowdfundingFixture();
      expect(await crowdfunding.getAddress()).to.be.properAddress;
    });

    it("Should set the deployer as the initial owner", async function () {
      const { crowdfunding, deployer } = await deployCrowdfundingFixture();
      expect(await crowdfunding.owner()).to.equal(deployer.address);
    });

    it("Should ensure a different wallet is not the owner", async function () {
      const { crowdfunding, otherAccount } = await deployCrowdfundingFixture();
      expect(await crowdfunding.owner()).to.not.equal(otherAccount.address);
    });
  });

  describe("Ownership Access Control", function () {
    it("Should prevent a non-owner from transferring ownership (onlyOwner protection)", async function () {
      const { crowdfunding, otherAccount, newAdmin } = await deployCrowdfundingFixture();
      await expect(
        crowdfunding.connect(otherAccount).transferOwnership(newAdmin.address)
      )
        .to.be.revertedWithCustomError(crowdfunding, "OwnableUnauthorizedAccount")
        .withArgs(otherAccount.address);
    });

    it("Should allow the owner to transfer ownership to another account", async function () {
      const { crowdfunding, deployer, newAdmin } = await deployCrowdfundingFixture();
      await expect(
        crowdfunding.connect(deployer).transferOwnership(newAdmin.address)
      )
        .to.emit(crowdfunding, "OwnershipTransferred")
        .withArgs(deployer.address, newAdmin.address);

      expect(await crowdfunding.owner()).to.equal(newAdmin.address);
    });

    it("Should allow the owner to renounce ownership", async function () {
      const { crowdfunding, deployer } = await deployCrowdfundingFixture();
      await expect(crowdfunding.connect(deployer).renounceOwnership())
        .to.emit(crowdfunding, "OwnershipTransferred")
        .withArgs(deployer.address, ethers.ZeroAddress);

      expect(await crowdfunding.owner()).to.equal(ethers.ZeroAddress);
    });
  });
});
