import type { AppProps } from "next/app"
import { MoralisProvider } from "react-moralis"
import { Header } from "../components/Header"
import { NotificationProvider } from "web3uikit"
import { ApolloProvider, ApolloClient, InMemoryCache } from "@apollo/client"
import "../styles/globals.css"

const client = new ApolloClient({
    uri: "https://api.studio.thegraph.com/query/48271/nft-market/version/latest",
    cache: new InMemoryCache(),
})

export default function App({ Component, pageProps }: AppProps) {
    return (
        <MoralisProvider initializeOnMount={false}>
            <ApolloProvider client={client}>
                <NotificationProvider>
                    <Header />
                    <Component {...pageProps} />
                </NotificationProvider>
            </ApolloProvider>
        </MoralisProvider>
    )
}
