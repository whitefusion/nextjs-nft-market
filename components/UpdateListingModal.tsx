import { Modal, useNotification, Input, Illustration, Button } from "web3uikit"
import { useState } from "react"
import { useWeb3Contract } from "react-moralis"
import { ethers } from "ethers"
import Image from "next/image"

export interface UpdateListingModalProps {
    isVisible: boolean
    onClose: () => void
    nftMarketplaceAbi: object
    nftMarketplaceAddress: string
    nftAddress: string
    tokenId: string
    imageURI: string | undefined
    currentPrice: number | undefined
}

export const UpdateListingModal = ({
    isVisible,
    onClose,
    nftMarketplaceAbi,
    nftAddress,
    nftMarketplaceAddress,
    tokenId,
    imageURI,
    currentPrice,
}: UpdateListingModalProps) => {
    const dispatch = useNotification()

    const [priceToUpdateListingWith, setPriceToUpdateListingWith] = useState<string | undefined>()

    const handleUpdateListingSuccess = () => {
        dispatch({
            type: "success",
            message: "update listing succeed",
            title: "Listing updated",
            position: "topR",
        })

        onClose && onClose()
    }

    const handleCancelListingSuccess = () => {
        dispatch({
            type: "success",
            message: "cancel listing succeed",
            title: "Listing canceled",
            position: "topR",
        })

        onClose && onClose()
    }

    const { runContractFunction: cancelListing } = useWeb3Contract({
        abi: nftMarketplaceAbi,
        contractAddress: nftMarketplaceAddress,
        functionName: "cancelListing",
        params: {
            nftAddress,
            tokenId,
        },
    })

    const { runContractFunction: updateListing } = useWeb3Contract({
        abi: nftMarketplaceAbi,
        contractAddress: nftMarketplaceAddress,
        functionName: "updateListing",
        params: {
            nftAddress,
            tokenId,
            newPrice: ethers.utils.parseEther(priceToUpdateListingWith || "0"),
        },
    })

    return (
        <Modal
            isVisible={isVisible}
            id="regular"
            onCancel={onClose}
            onCloseButtonPressed={onClose}
            onOk={() => {
                updateListing({
                    onSuccess: handleUpdateListingSuccess,
                })
            }}
            title="NFT details"
            okText="Save new listing price"
            cancelText="Leave it"
            isOkDisabled={!priceToUpdateListingWith}
        >
            <div className="flex flex-col items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <p className="p-4 text-lg">
                        This is your listing. You may either update the listing price or cancel it.
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
                        <div className="font-bold">
                            {ethers.utils.formatEther(currentPrice || 0)} ETH
                        </div>
                    </div>
                    <Input
                        label="update listing price"
                        name="new listing price"
                        onChange={(event) => {
                            setPriceToUpdateListingWith(event.target.value)
                        }}
                        type="number"
                    />
                    or
                    <Button
                        id="cancel-listing"
                        onClick={() => {
                            cancelListing({
                                onSuccess: handleCancelListingSuccess,
                            })
                        }}
                        text="cancel listing"
                        theme="colored"
                        color="red"
                        type="button"
                    />
                </div>
            </div>
        </Modal>
    )
}
