
import BananaCat from "./assets/cats/BananaCat.jpeg";
import SmudgeCat from "./assets/cats/smudgeCat.jpeg";
import MaxwellCat from "./assets/cats/spinningcat.jpeg";
import KeyboardCat from "./assets/cats/keyboardCat.jpeg";
import NyanCat from "./assets/cats/nyanCat.png";

type CatMemeProps = {
  situation:
    | "no-listings"
    | "no-results"
    | "loading"
    | "recovered"
    | "claim-success";
};

const catMemes = {
  "no-listings": {
    image: BananaCat,
    title: "Nothing here... yet!",
    message: "Even Banana Cat is crying. Be the first to report a lost or found item!"
  },
  "no-results": {
    image: SmudgeCat,
    title: "WHAT DO YOU MEAN NO RESULTS?!",
    message: "We couldn't find what you're looking for. Try another search."
  },
  loading: {
    image: MaxwellCat,
    title: "Hold on...",
    message: "Maxwell is working on it. Just a second!"
  },
  recovered: {
    image: KeyboardCat,
    title: "WE HAVE A HAPPY ENDING!",
    message: "Another lost item has made its way home!"
  },
  "claim-success": {
    image: NyanCat,
    title: "CLAIM SUBMITTED!",
    message: "Your claim is in. Fingers crossed for a happy reunion!"
  }
};

export default function CatMeme({ situation }: CatMemeProps) {
  const meme = catMemes[situation];

  return (
    <div className="flex flex-col items-center justify-center text-center py-10 px-4">
      <img
        src={meme.image}
        alt="Cat meme"
        className="w-52 h-52 object-contain rounded-2xl mb-5"
      />

      <h2 className="text-xl font-bold text-[#F5F5F0] mb-2">
        {meme.title}
      </h2>

      <p className="text-sm text-[#A5A6A2] max-w-sm">
        {meme.message}
      </p>
    </div>
  );
}
