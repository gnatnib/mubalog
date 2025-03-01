import { Heart } from "lucide-react"
import Link from "next/link"

export default function Footer() {
  return (
    <footer className="py-6 border-t">
      <div className="container flex items-center justify-center text-sm text-muted-foreground">
        <p className="flex items-center gap-1">
          Made with <Heart className="w-4 h-4 text-red-500 fill-red-500" /> by{" "}
          <Link
            href="https://github.com/gnatnib"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary hover:underline"
          >
            this guy
          </Link>
        </p>
      </div>
    </footer>
  )
}

