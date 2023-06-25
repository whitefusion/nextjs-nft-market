import type { NextPage } from "next"
import { Card, Tooltip, Illustration, Modal, useNotification, Input, Button } from "web3uikit"
import nftAbi from "../constants/BasicNFT.json"
import nftMarketplaceAbi from "../constants/Nftmarketplace.json"
import { useMoralis, useWeb3Contract } from "react-moralis"
import { SellNFTModal } from "./SellNFTModal"
import { UpdateListingModal } from "./UpdateListingModal"
import Image from "next/image"
import { useState, useEffect } from "react"
import { ethers } from "ethers"

interface NFTBoxProps {
    price?: number
    nftAddress: string
    tokenId: string
    nftMarketplaceAddress: string
    seller?: string
}

const truncateStr = (fullStr: string, strLen: number) => {
    if (fullStr.length <= strLen) return fullStr

    const separator = "..."

    let sepLen = separator.length,
        charsToShow = strLen - sepLen,
        frontChars = Math.ceil(charsToShow / 2),
        backChars = Math.ceil(charsToShow / 2)

    return (
        fullStr.substring(0, frontChars) +
        separator +
        fullStr.substring(fullStr.length - backChars)
    )
}

const NFTBox: NextPage<NFTBoxProps> = ({
    price,
    nftAddress,
    tokenId,
    nftMarketplaceAddress,
    seller,
}: NFTBoxProps) => {
    const { isWeb3Enabled, account } = useMoralis()
    const [imageURI, setImageURI] = useState<string | undefined>()
    const [tokenName, setTokenName] = useState<string | undefined>()
    const [tokenDescription, setTokenDescription] = useState<string | undefined>()
    const [showModal, setShowModal] = useState(false)
    const [tokenURI, setTokenURI] = useState<string | undefined>(undefined)
    const hideModal = () => setShowModal(false)
    const isListed = seller !== undefined

    const dispatch = useNotification()

    useEffect(() => {
        updateUI()
    }, [tokenURI])

    useEffect(() => {
        isWeb3Enabled &&
            getTokenURI({
                onError: (e) => {
                    console.log("params:", {
                        abi: nftAbi,
                        contractAddress: nftAddress,
                        functionName: "tokenURI",
                        params: {
                            tokenId,
                        },
                    })
                    console.log("token uri e: ", e)
                },
                onSuccess: (data) => {
                    if (data) {
                        setTokenURI(data as string)
                    }
                },
            })
    }, [isWeb3Enabled])

    const { runContractFunction: getTokenURI } = useWeb3Contract({
        abi: nftAbi,
        contractAddress: nftAddress,
        functionName: "tokenURI",
        params: {
            tokenId: parseInt(tokenId),
        },
    })

    const { runContractFunction: buyItem, error: buyError } = useWeb3Contract({
        abi: nftMarketplaceAbi,
        contractAddress: nftMarketplaceAddress,
        functionName: "buyItem",
        msgValue: price,
        params: {
            nftAddress,
            tokenId,
        },
    })

    const updateUI = async () => {
        // console.log(`TokenURI is : ${tokenURI}`)
        if (tokenURI) {
            const requestURL = (tokenURI as string).replace("ipfs://", "https://ipfs.io/ipfs/")
            const tokenURIResponse = await (await fetch(requestURL)).json()
            const imageURI = tokenURIResponse.image
            const imageURIURL = (imageURI as string).replace("ipfs://", "https://ipfs.io/ipfs/")
            setImageURI(imageURIURL)
            setTokenName(tokenURIResponse.name)
            setTokenDescription(tokenURIResponse.description)
        }
    }

    const handleCardClick = async () => {
        if (isOwnedByUser) {
            setShowModal(true)
        } else {
            await buyItem({
                onSuccess: () => handleBuyItemSuccess(),
                onError: (e) => console.log,
            })
        }
    }

    const handleBuyItemSuccess = () => {
        dispatch({
            type: "success",
            message: "Item bought succeed",
            title: "Item bought",
            position: "topR",
        })
    }

    const isOwnedByUser = seller === account || seller === undefined
    const formattedSellerAddress = isOwnedByUser ? "you" : truncateStr(seller || "", 15)

    const tooltipContent = isListed
        ? isOwnedByUser
            ? "Update Listing"
            : "Buy me"
        : "Create Listing"

    return (
        <div className="p-2">
            <SellNFTModal
                isVisible={showModal && !isListed}
                imageURI={imageURI}
                nftAbi={nftAbi}
                nftMarketplaceAbi={nftMarketplaceAbi}
                nftAddress={nftAddress}
                tokenId={tokenId}
                onClose={hideModal}
                nftMarketplaceAddress={nftMarketplaceAddress}
            />
            <UpdateListingModal
                isVisible={showModal && isListed}
                imageURI={imageURI}
                nftMarketplaceAbi={nftMarketplaceAbi}
                nftAddress={nftAddress}
                tokenId={tokenId}
                onClose={hideModal}
                nftMarketplaceAddress={nftMarketplaceAddress}
                currentPrice={price}
            />
            <Card title={tokenName} description={tokenDescription} onClick={handleCardClick}>
                <Tooltip content={tooltipContent} position="top">
                    <div className="p-2">
                        {imageURI ? (
                            <div className="flex flex-col items-end gap-2">
                                <div>#{tokenId}</div>
                                <div className="italic text-sm">
                                    Owned by {formattedSellerAddress}
                                </div>
                                <Image
                                    loader={() => imageURI}
                                    src={imageURI}
                                    height={200}
                                    width={200}
                                    alt=""
                                />
                                {price && (
                                    <div className="font-bold">
                                        {ethers.utils.formatEther(price)} ETH
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex flex-col items-end gap-1">
                                <Illustration height="180px" logo="lazyNft" width="100%" />
                                Loading ...
                            </div>
                        )}
                    </div>
                </Tooltip>
            </Card>
        </div>
    )
}

export default NFTBox
