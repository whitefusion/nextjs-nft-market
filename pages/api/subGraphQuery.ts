import { gql } from "@apollo/client"

export const GET_ACTIVE_ITEMS = gql`
    {
        activeItems(first: 5, where: { buyer: "0x0000000000000000000000000000000000000000" }) {
            buyer
            nftAddress
            price
            seller
            tokenId
        }
    }
`

export const GET_SELL_ACTIVE_ITEMS = gql`
    query SellActiveItems($seller: String) {
        activeItems(first: 5, where: { seller: $seller }) {
            buyer
            nftAddress
            price
            seller
            tokenId
        }
    }
`
