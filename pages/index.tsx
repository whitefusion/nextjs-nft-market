import { useMoralis } from "react-moralis"
import networkMapping from "../constants/networkMapping.json"
import { GET_ACTIVE_ITEMS } from "./api/subGraphQuery"
import NFTBox from "../components/NFTBox"
import { useQuery } from "@apollo/client"

export default function Home() {
    // how to show recent listed NFTs? it's hard to extract data from contracts
    // we will index the events off-chain and then read from our database
    // setup a server to listen for those events to be fired
    // and we will add them to a database to query
    const { isWeb3Enabled, chainId } = useMoralis()
    const chainString = chainId ? parseInt(chainId).toString() : "31337"
    const marketplaceAddress = ((networkMapping as any) || {})?.[chainString]?.[
        "NftMarketplace"
    ]?.[0]
    const { loading, data: listedNfts } = useQuery(GET_ACTIVE_ITEMS)

    return (
        <div className="container mx-auto">
            <h1 className="py-4 px-4 font-bold text-xl"> Recently Listed </h1>
            <div className="flex flex-wrap">
                {isWeb3Enabled ? (
                    loading || !listedNfts ? (
                        <div>Loading ...</div>
                    ) : (
                        listedNfts.activeItems.map((nft: any) => {
                            const { price, nftAddress, tokenId, seller } = nft
                            return marketplaceAddress ? (
                                <NFTBox
                                    price={price}
                                    nftAddress={nftAddress}
                                    tokenId={tokenId}
                                    seller={seller}
                                    nftMarketplaceAddress={marketplaceAddress}
                                    key={`${tokenId}${nftAddress}`}
                                />
                            ) : (
                                <div> Network error, please switch to a supported network </div>
                            )
                        })
                    )
                ) : (
                    <div> Web3 currently not enabled ... </div>
                )}
            </div>
        </div>
    )
}
