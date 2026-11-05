import bannermain from "../assets/pandharpurvari.jpg";
import "/src/App.css";
import { useState } from "react";
import { Trophy, Shield, Star, Church, Users } from "lucide-react";
import mapimg from "../assets/mapbk.png"; // replace with your actual image path
import paradeImage from "../assets/varkari.png"; // replace with your actual image path
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import aboutimg from "../assets/anilkhedkar.png"; // replace with your actual image path
import galleryImg1 from "../assets/varkari.png"; // replace with your actual image paths
import galleryImg2 from "../assets/varkari.png";
import galleryImg3 from "../assets/varkari.png";
import galleryImg4 from "../assets/varkari.png";
import galleryImg5 from "../assets/varkari.png";



const achievements = [
  {
    icon: Trophy,
    title: "40 Under 40",
    subtitle: "EU Business Professional",
    description:
      "Recognized for exceptional professional accomplishments and leadership.",
  },
  {
    icon: Shield,
    title: "Shiv Pratisthan",
    subtitle: "Pioneer Award",
    description:
      "Honored for contributions to cultural and community development.",
  },
  {
    icon: Star,
    title: "Akhand Bharat Parishad",
    subtitle: "Global Varkari Award",
    description:
      "Recognized for outstanding efforts in promoting the Varkari tradition globally.",
  },
  {
    icon: Church,
    title: "First Vitthal Rukmini",
    subtitle: "Temple in UK",
    description:
      "Contributed to establishing the first Vitthal Rukmini Temple in the UK.",
  },
  {
    icon: Users,
    title: "Global Varkari",
    subtitle: "Network",
    description:
      "Active role in strengthening the global Varkari community.",
  },
];
const stats = [
  { value: "22", label: "Countries" },
  { value: "18,000 KM", label: "Distance Covered" },
  { value: "70", label: "Days" },
  { value: "Countless", label: "Blessings" },
];

const images = [galleryImg1, galleryImg2, galleryImg3, galleryImg4, galleryImg5];
const gallerySlides = Array.from({ length: Math.ceil(images.length / 5) }, (_, index) =>
  images.slice(index * 5, index * 5 + 5)
);

function Home() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goPrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  return (
    <main>
      <section
        className="hero home-hero"
        style={{
          backgroundImage: `url(${bannermain})`,
        }}
      >
      
      </section>

      <section className="about-section">
        <div className="about-grid">
          <div className="about-img-card">
            <img src={aboutimg} alt="Portrait" />
          </div>

          <div className="about-body">
            <span className="eyebrow">About</span>
            <h2 className="about-title">
              A Visionary Leader Bridging Healthcare,{" "}
              <span className="accent-text">Devotion</span> &amp; Cultural
              Heritage
            </h2>
            <p className="about-paragraph">
              Dr. Anil Eknath Khedkar is a respected medical professional and
              a devoted cultural Global Varkari, committed to preserving and
              promoting the spiritual legacy of Maharashtra on a global
              platform.
            </p>
            <p className="about-paragraph">
              Based in the United Kingdom, he has emerged as a key figure in
              integrating traditional Indian devotional practices with modern
              community life abroad.
            </p>
            <div className="about-signature">Anil E. Khedkar</div>
          </div>

          <div className="about-skills">
              <a  className="about-cta">
              Know More About Dr. Khedkar
            </a>
            {[
              { title: "PhD", subtitle: "Clinical Research" },
              { title: "Master's", subtitle: "Pharmaceutical Sciences" },
              { title: "Bachelor's", subtitle: "Pharmacy" },
            ].map((item) => (
              <div key={item.title} className="skill-item">
                <div className="skill-badge">{item.title[0]}</div>
                <div>
                  <div className="skill-title">{item.title}</div>
                  <div className="skill-subtitle">{item.subtitle}</div>
                </div>
              </div>
            ))}
          
          </div>
        </div>
      </section>

      <section className="mission-section">
        <div className="mission-grid-wrapper">
          <div className="mission-intro">
            <p className="eyebrow eyebrow-light">Global Varkari Mission</p>
            <h2 className="mission-title">
              Spreading the Spirit of Varkari Tradition Worldwide
            </h2>
            <p className="mission-paragraph">
              Inspired by the sacred tradition of Vitthal Rukmini and the
              historic Vari pilgrimage, Dr. Khedkar is dedicated to taking
              this divine legacy beyond borders and uniting hearts across the
              world.
            </p>
           
          </div>

          <div className="mission-grid">
            {[
              {
                title: "Preserve",
                description:
                  "Preserving the rich cultural and spiritual heritage of Varkari tradition.",
              },
              {
                title: "Promote",
                description:
                  "Promoting the values of devotion, unity and compassion globally.",
              },
              {
                title: "Connect",
                description: "Connecting Varkari communities across continents.",
              },
              {
                title: "Inspire",
                description:
                  "Inspiring future generations through faith and service.",
              },
            ].map((item) => (
              <div key={item.title} className="mission-card">
                <div className="mission-card-badge">{item.title[0]}</div>
                <h3 className="mission-card-title">{item.title}</h3>
                <p className="mission-card-description">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

       <section className="journey-section">
      <div className="journey-grid">
        <div className="journey-content">
          <span className="journey-eyebrow">Historic Initiative</span>
 
          <h2 className="journey-title">Pandharpur to London Vari</h2>
 
          <div className="journey-divider">
            <span className="journey-divider-line" />
            <span className="journey-divider-dot" />
            <span className="journey-divider-line" />
          </div>
 
          <p className="journey-description">
            A landmark spiritual movement that symbolically recreates the
            sacred pilgrimage experience outside India, spreading the
            blessings of Lord Vitthal across the globe.
          </p>
 
          <div className="journey-stats">
            {stats.map((stat) => (
              <div className="journey-stat" key={stat.label}>
                <div className="journey-stat-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="22" height="22">
                    <circle
                      cx="12"
                      cy="12"
                      r="9"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeDasharray="2.2 2.4"
                    />
                  </svg>
                </div>
                <div>
                  <div className="journey-stat-value">{stat.value}</div>
                  <div className="journey-stat-label">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
 
          <a className="journey-cta" href="#discover-journey">
            Discover the Journey
            <ArrowRight size={18} strokeWidth={2.2} />
          </a>
        </div>
 
        <div className="journey-image-wrap">
          <img
            className="journey-image"
            src={paradeImage}
            alt="Pandharpur to London Vari procession"
          />
           
        </div>
      </div>
    </section>
    <section className="map-section ">
      <img src={mapimg} alt="Map of the journey" width="100%" />
    </section>
    <section className="achievements-section">
      <div className="achievements-header">
        <span className="achievements-eyebrow">
          Achievements &amp; Recognitions
        </span>
        <div className="achievements-divider">
          <span className="achievements-divider-line" />
          <span className="achievements-divider-dot" />
          <span className="achievements-divider-line" />
        </div>
      </div>
 
      <div className="achievements-grid">
        {achievements.map((item) => {
          const Icon = item.icon;
          return (
            <div className="achievement-card" key={item.title}>
              <div className="achievement-icon">
                <Icon size={36} strokeWidth={1.5} />
              </div>
              <h3 className="achievement-title">
                {item.title}
                <span className="achievement-subtitle">{item.subtitle}</span>
              </h3>
              <p className="achievement-description">{item.description}</p>
            </div>
          );
        })}
      </div>
    </section>
     <section className="gallery-section">
      <div className="gallery-header">
        <span className="gallery-eyebrow">Gallery</span>
        <h2 className="gallery-title">Moments of Devotion</h2>
        <div className="gallery-divider">
          <span className="gallery-divider-line" />
          <span className="gallery-divider-dot" />
          <span className="gallery-divider-line" />
        </div>
      </div>
 
      <div className="gallery-slider">
        <button
          type="button"
          className="gallery-arrow gallery-arrow-left"
          aria-label="Previous photo"
          onClick={goPrev}
        >
          <ChevronLeft size={22} />
        </button>

        <div className="gallery-viewport">
          <div
            className="gallery-track"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {gallerySlides.map((slideImages, index) => (
              <div
                className={`gallery-slide${index === currentIndex ? " gallery-slide-active" : ""}`}
                key={`gallery-slide-${index}`}
              >
                <div className="gallery-slide-grid">
                  {slideImages.map((src, imageIndex) => (
                    <img
                      key={`${src}-${imageIndex}`}
                      src={src}
                      alt={`Gallery moment ${index * 4 + imageIndex + 1}`}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          type="button"
          className="gallery-arrow gallery-arrow-right"
          aria-label="Next photo"
          onClick={goNext}
        >
          <ChevronRight size={22} />
        </button>
      </div>
 
      <a className="gallery-cta" href="#more-photos">
        View More Photos
        <ArrowRight size={16} strokeWidth={2.2} />
      </a>
    </section>
  
    </main>
  );
}

export default Home;