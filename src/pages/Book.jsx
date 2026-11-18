import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import bookCoverFallback from "../assets/vithobabook.png";
import { bookAssetUrl, fetchBooks } from "../services/bookApi";


/* ---- Inline icons ---- */
const CheckIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2">
    <circle cx="12" cy="12" r="9" />
    <path d="m8.5 12.2 2.4 2.4 4.6-5.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ImageIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="9" cy="9" r="1.5" fill="currentColor" stroke="none" />
    <path d="m21 15-5-5-9 9" />
  </svg>
);

const checklistItems = [
  { icon: <CheckIcon />, text: "The Discovery in London" },
  { icon: <CheckIcon />, text: "The Road Journey" },
  { icon: <CheckIcon />, text: "Experiences & Challenges" },
  { icon: <CheckIcon />, text: "The Message of Vithoba" },
  { icon: <ImageIcon />, text: "Photos, Stories & Reflections" },
];

export default function Book() {
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [booksError, setBooksError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    fetchBooks({ signal: controller.signal })
      .then((books) => {
        setBook(books[0] || null);
      })
      .catch((error) => {
        if (error.name !== "AbortError") {
          setBooksError(error.message);
        }
      });

    return () => controller.abort();
  }, []);

  const coverImage = book?.cover_image_url || book?.image_urls?.[0];

  return (
    <section className="book-section mt-5">
      <div className="book-content">
        <p className="book-eyebrow">The Book</p>
        <h2 className="book-title">{book?.title || "Vithoba in London"}</h2>
        <p className="book-subtitle">A Journey of Faith &amp; Discovery</p>

        <div className="book-divider">
          <span className="line" />
          <span className="diamond" />
          <span className="line" />
        </div>

        <p className="book-desc">
          {book?.description || "A true story of devotion, the discovery of the Vithoba idol template in London, and the incredible journey by car from Paduka, Pune to London."}
        </p>

        {booksError && <p className="book-desc" role="alert">{booksError}</p>}

        <ul className="book-checklist">
          {checklistItems.map((item, i) => (
            <li key={i}>
              <span className="check-icon">{item.icon}</span>
              <span>{item.text}</span>
            </li>
          ))}
        </ul>

        <button
          className="order-btn"
          onClick={() => book?.id && navigate(`/checkout?bookId=${book.id}`)}
          disabled={!book?.id}
        >
          Order Your Copy
        </button>
      </div>

     <section>
       <img
         src={coverImage ? bookAssetUrl(coverImage) : bookCoverFallback}
         alt={`${book?.title || "Vithoba in London"} Book Cover`}
         className="book-image"
       />
     </section>
    </section>
  );
}