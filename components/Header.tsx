import { ConnectButton } from "web3uikit"
import Link from "next/link"

export const Header: React.FC<any> = () => {
    return (
        <nav>
            <div className="p-5 border-b-2 flex flex-row justify-between items-center">
                <h1 className="py-4 px-4 font-bold text-3xl">NFT Marketplace</h1>
                <div className="flex flex-row items-center ">
                    <Link href="/">
                        <a className="mr-4 p-6 text-xl" href="">
                            {" "}
                            Market{" "}
                        </a>
                    </Link>
                    <Link href="/sell">
                        <a className="mr-4 p-6 text-xl" href="">
                            {" "}
                            Sell{" "}
                        </a>
                    </Link>
                    <ConnectButton moralisAuth={false} />
                </div>
            </div>
        </nav>
    )
}
