import { Modal, useNotification, Input, Illustration } from "web3uikit"
import { useState } from "react"
import { useWeb3Contract } from "react-moralis"
import { ethers } from "ethers"
import Image from "next/image"

export interface SellNftModalProps {
    isVisible: boolean
    onClose: () => void
    nftAbi: object
    nftMarketplaceAbi: object
    nftMarketplaceAddress: string
    nftAddress: string
    tokenId: string
    imageURI: string | undefined
}

export const SellNFTModal = ({
    isVisible,
    onClose,
    nftAbi,
    nftMarketplaceAbi,
    nftMarketplaceAddress,
    nftAddress,
    tokenId,
    imageURI,
}: SellNftModalProps) => {
    const dispatch = useNotification()
    const [priceToListWith, setPriceToListWith] = useState<string | undefined>()
    // @ts-ignore
    const { data, error, runContractFunction, isFetching, isLoading } = useWeb3Contract()

    const approveAndList = async () => {
        if (!priceToListWith) {
            console.error("Listing price not set")
            return
        }

        const options = {
            abi: nftAbi,
            contractAddress: nftAddress,
            functionName: "approve",
            params: {
                to: nftMarketplaceAddress,
            },
        }

        await runContractFunction({
            params: options,
            onSuccess: () => handleApproveSuccess(nftAddress, tokenId, priceToListWith),
        })
    }

    const handleApproveSuccess = async (nftAddress: string, tokenId: string, price: string) => {
        console.log("approve success")
        const options = {
            abi: nftMarketplaceAbi,
            contractAddress: nftMarketplaceAddress,
            functionName: "listItem",
            params: {
                nftAddress,
                tokenId,
                price: ethers.utils.parseEther(price),
            },
        }

        await runContractFunction({
            params: options,
            onSuccess: handleListItemSuccess,
        })
    }

    const handleListItemSuccess = async () => {
        dispatch({
            type: "success",
            message: "Item listed succeed !",
            title: "Item listed",
            position: "topR",
        })
        onClose && onClose()
    }

    return (
        <Modal
            isVisible={isVisible}
            id="regular"
            onCancel={onClose}
            onCloseButtonPressed={onClose}
            onOk={approveAndList}
            title="NFT Details"
            okText="Create Listing"
            cancelText="Cancel"
            isOkDisabled={!priceToListWith}
        >
            <div className="flex flex-col items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <p className="p-4 text-lg">
                        Create a listing to allow others to purchase your NFT
                    </p>
                    <div className="flex flex-col items-end gap-2 border-solid border-2 border-gray-400 rounded p-2 w-fit">
                        <div>#{tokenId}</div>
                        {imageURI ? (
                            <Image
                                loader={() => imageURI}
                                src={imageURI}
                                width="200"
                                height="200"
                                alt=""
                            />
                        ) : (
                            <Illustration height="180px" width="180px" logo="lazyNft" />
                        )}
                    </div>
                    <Input
                        label="Set listing price"
                        name="listing price"
                        onChange={(event) => {
                            setPriceToListWith(event.target.value)
                        }}
                        type="number"
                    />
                </div>
            </div>
        </Modal>
    )
}
