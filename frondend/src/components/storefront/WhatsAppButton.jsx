import { useSiteConfig } from '../../context/SiteConfigContext';

export default function WhatsAppButton() {
  const { config } = useSiteConfig();
  const phone = config?.footer?.contact?.phone || '';
  const sanitizedPhone = phone.replace(/[^0-9]/g, '');
  const customWhatsApp = config?.footer?.socialLinks?.whatsapp;

  const whatsappUrl = customWhatsApp && customWhatsApp !== '#'
    ? customWhatsApp
    : (sanitizedPhone ? `https://wa.me/${sanitizedPhone}` : 'https://wa.me/');

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="whatsapp-float-link"
      aria-label="Chat with us on WhatsApp"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="65"
        height="65"
        viewBox="0 0 65 65"
        fill="none"
      >
        <g filter="url(#filter0_d_1_24258)">
          <rect
            x="4.30005"
            y="4.29999"
            width="56"
            height="56"
            rx="28"
            fill="#016039"
          />
          <path
            d="M29.5172 15.8574C22.8538 16.934 17.3972 22.1374 16.0072 28.7424C15.0588 33.2424 15.9688 37.4824 18.0588 40.9257L17.3272 47.0157C17.1155 48.2474 18.2855 49.264 19.4755 48.8857L24.8305 47.1824C27.9555 48.754 31.6288 49.4007 35.5089 48.6574C42.3055 47.3557 47.7105 41.7824 48.7622 34.9407C50.5005 23.6274 40.8455 14.0257 29.5172 15.8574ZM40.5639 38.154C40.4439 38.8907 39.9939 39.529 39.3439 39.894C38.3722 40.439 37.0972 40.7524 35.9155 40.589C35.4572 40.5257 34.9872 40.394 34.5155 40.2324C31.2222 39.2557 28.4755 36.3357 28.3472 36.1974C28.2555 36.1157 25.3338 33.369 24.3588 30.074C24.1972 29.6024 24.0655 29.134 24.0022 28.6757C23.8405 27.4957 24.1538 26.2207 24.6988 25.249C25.0638 24.599 25.7022 24.149 26.4388 24.029C27.0488 23.929 27.8438 23.8957 28.5888 24.159C28.8038 24.2357 28.9955 24.3874 29.1355 24.5674C29.8238 25.459 30.3072 26.5157 30.5272 27.154C30.6772 27.589 30.5605 28.064 30.2455 28.3957L30.0872 28.554L28.9322 29.6574C28.9322 29.6574 28.9322 29.684 28.9338 29.709L26.9088 31.7324C28.0238 33.6024 29.5038 34.999 29.5255 35.0207C29.5788 35.0757 30.9888 36.564 32.8622 37.684L34.8855 35.6607C34.9088 35.6607 34.9372 35.6624 34.9372 35.6624L36.0389 34.509L36.1972 34.3507C36.5289 34.0357 37.0039 33.9207 37.4389 34.069C38.0772 34.289 39.1355 34.7724 40.0255 35.4607C40.2072 35.6007 40.3589 35.7907 40.4339 36.0074C40.6972 36.749 40.6639 37.544 40.5639 38.154Z"
            fill="white"
          />
        </g>
        <defs>
          <filter
            id="filter0_d_1_24258"
            x="4.86374e-05"
            y="-1.23978e-05"
            width="64.6"
            height="64.6"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix" />
            <feColorMatrix
              in="SourceAlpha"
              type="matrix"
              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
              result="hardAlpha"
            />
            <feOffset />
            <feGaussianBlur stdDeviation="2.15" />
            <feComposite in2="hardAlpha" operator="out" />
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 0.0574669 0 0 0 0 0.346663 0 0 0 0 0.207121 0 0 0 0.25 0"
            />
            <feBlend
              mode="normal"
              in2="BackgroundImageFix"
              result="effect1_dropShadow_1_24258"
            />
            <feBlend
              mode="normal"
              in="SourceGraphic"
              in2="effect1_dropShadow_1_24258"
              result="shape"
            />
          </filter>
        </defs>
      </svg>
    </a>
  );
}
