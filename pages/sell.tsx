import { NextPage } from "next"
import { Button, useNotification, Form } from "web3uikit"
import { useWeb3Contract, useMoralis, useNFTBalances, useChain } from "react-moralis"
import { GET_SELL_ACTIVE_ITEMS } from "./api/subGraphQuery"
import nftAbi from "../constants/BasicNFT.json"

import nftMarketplaceAbi from "../constants/Nftmarketplace.json"
import networkMapping from "../constants/networkMapping.json"
import { BigNumber, ethers } from "ethers"
import { useState, useEffect } from "react"
import { useQuery } from "@apollo/client"
import NFTBox from "../components/NFTBox"

type NetworkConfigItem = {
    NftMarketplace: string[]
}

type NetworkConfigMap = {
    [chainId: string]: NetworkConfigItem
}

type chainType =
    | "eth"
    | "0x1"
    | "ropsten"
    | "0x3"
    | "rinkeby"
    | "0x4"
    | "goerli"
    | "0x5"
    | "kovan"
    | "0x2a"
    | "polygon"
    | "0x89"
    | "mumbai"
    | "0x13881"
    | "bsc"
    | "0x38"
    | "bsc testnet"
    | "0x61"
    | "avalanche"
    | "0xa86a"
    | "avalanche testnet"
    | "0xa869"
    | "fantom"
    | "0xfa"

const Sell: NextPage = () => {
    const dispatch = useNotification()
    const { account, isWeb3Enabled } = useMoralis()
    const { chainId } = useChain()
    const chainString = chainId ? parseInt(chainId).toString() : "31337"
    const currentNetworkMapping = (networkMapping as NetworkConfigMap)[chainString]
    const [availableProceeds, setAvailableProceeds] = useState<BigNumber | undefined>(undefined)

    const nftMarketplaceAddress = currentNetworkMapping?.NftMarketplace?.[0]
    // @ts-ignore
    const { data, error, runContractFunction, isFetching, isLoading } = useWeb3Contract({})

    const fetchAvailableProceeds = async () => {
        const options = {
            abi: nftMarketplaceAbi,
            contractAddress: nftMarketplaceAddress,
            functionName: "getProceeds",
            params: {
                seller: account,
            },
        }

        const result = await runContractFunction({
            params: options,
        })

        setAvailableProceeds(result as BigNumber)
    }

    // get NFT balances

    const { getNFTBalances, data: nfts } = useNFTBalances()

    useEffect(() => {
        fetchAvailableProceeds()
        getNFTBalances({
            params: {
                address: account || "",
                chain: (chainId || "0x1") as chainType,
            },
        })
    }, [account, chainId, isWeb3Enabled])

    const handleWithdraw = async () => {
        const options = {
            abi: nftMarketplaceAbi,
            contractAddress: nftMarketplaceAddress,
            functionName: "withdrawProceeds",
        }

        await runContractFunction({
            params: options,
            onSuccess: handleWithdrawSuccess,
        })
    }

    const handleWithdrawSuccess = () => {
        dispatch({
            type: "success",
            message: "Proceeds withdrawn successfully",
            title: "Proceeds withdrawn",
            position: "topR",
        })
    }

    const { loading, data: listedNfts } = useQuery(GET_SELL_ACTIVE_ITEMS, {
        variables: {
            seller: account,
        },
    })

    const hasNonZeroAvailableProceeds =
        availableProceeds !== undefined && !availableProceeds.isZero()

    const getSellerAndPrice = (nftAddress: string, tokenId: string) => {
        const matchListing = listedNfts.find((nft: any) => {
            const { nftAddress: tempNftAddress, tokenId: tempTokenId } = nft
            return tempNftAddress === nftAddress && tempTokenId === tokenId
        })

        return matchListing
            ? {
                  seller: matchListing.seller,
                  price: matchListing.price,
              }
            : {
                  seller: undefined,
                  price: undefined,
              }
    }

    const approveAndList = async (data: any) => {
        console.log("Approving ...")
        const nftAddress = data.data[0].inputResult
        const tokenId = data.data[1].inputResult
        const price = ethers.utils.parseUnits(data.data[2].inputResult, "ether").toString()

        const approveOptions = {
            abi: nftAbi,
            contractAddress: nftAddress,
            functionName: "approve",
            params: {
                to: nftMarketplaceAddress,
                tokenId,
            },
        }

        await runContractFunction({
            params: approveOptions,
            onSuccess: (tx) => handleApproveSuccess(tx, nftAddress, tokenId, price),
            onError: (error) => console.error,
        })
    }

    // @ts-ignore
    const handleApproveSuccess = async (tx, nftAddress, tokenId, price) => {
        await tx.wait()
        const listOptions = {
            abi: nftMarketplaceAbi,
            contractAddress: nftMarketplaceAddress,
            functionName: "listItem",
            params: {
                nftAddress,
                tokenId,
                price,
            },
        }

        await runContractFunction({
            params: listOptions,
            onSuccess: handleListSuccess,
            onError: (e) => console.log,
        })
    }

    const handleListSuccess = async () => {
        dispatch({
            type: "success",
            message: "NFT listing !",
            title: "NFT listed",
            position: "topR",
        })
    }

    if (!currentNetworkMapping) {
        const error = `No entry in networkMapping.json matching the current chain ID of ${chainString}`
        console.error(error)
        return <div>Error: {error}</div>
    }

    return (
        <div className="container mx-auto">
            <div className="py-4">
                <Form
                    onSubmit={approveAndList}
                    data={[
                        {
                            name: "NFT Address",
                            type: "text",
                            inputWidth: "50%",
                            value: "",
                            key: "nftAddress",
                        },
                        {
                            name: "Token Id",
                            type: "number",
                            value: "",
                            key: "tokenId",
                        },
                        {
                            name: "Price (In ETH)",
                            type: "number",
                            value: "",
                            key: "price",
                        },
                    ]}
                    title="Sell your NFT"
                    id="Main form"
                />
                <div className="flex flex-wrap">
                    {(nfts?.result || []).map((nft) => {
                        const { token_address, token_id } = nft
                        const { seller, price } = getSellerAndPrice(token_address, token_id)

                        return (
                            <NFTBox
                                nftAddress={token_address}
                                nftMarketplaceAddress={nftMarketplaceAddress}
                                tokenId={token_id}
                                seller={seller}
                                price={price}
                                key={`${token_id}${token_address}`}
                            />
                        )
                    })}
                </div>
            </div>
            <div className="py-4">
                <div className="flex flex-col gap-2 justify-items-start w-fit">
                    <h2 className="text-2xl">Withdraw Proceeds</h2>
                    {hasNonZeroAvailableProceeds ? (
                        <p>
                            Sales proceeds available for withdraw:{" "}
                            {ethers.utils.formatEther(availableProceeds as BigNumber)} ETH
                        </p>
                    ) : (
                        <p> No Withdrawable proceeds</p>
                    )}
                    <Button
                        disabled={!hasNonZeroAvailableProceeds}
                        id="withdraw-proceeds"
                        onClick={handleWithdraw}
                        text="Withdraw"
                        theme="primary"
                        type="button"
                    />
                </div>
            </div>
        </div>
    )
}

export default Sell
