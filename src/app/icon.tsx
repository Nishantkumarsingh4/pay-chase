import { ImageResponse } from 'next/og';

export const size = {
  width: 32,
  height: 32,
};
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0f172a 0%, #030712 100%)',
          borderRadius: '8px',
          border: '1.5px solid rgba(99, 102, 241, 0.6)',
          position: 'relative',
        }}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* P stem & loop */}
          <path
            d="M8 6C8 4.89543 8.89543 4 10 4H18C22.4183 4 26 7.58172 26 12C26 16.4183 22.4183 20 18 20H13V26C13 27.1046 12.1046 28 11 28H10C8.89543 28 8 27.1046 8 26V6Z"
            fill="#818CF8"
          />
          {/* Cutout */}
          <path
            d="M13 9H17.5C19.433 9 21 10.567 21 12.5C21 14.433 19.433 16 17.5 16H13V9Z"
            fill="#030712"
          />
          {/* Dart / Bolt */}
          <path
            d="M16 10.5L20 12.5L16 14.5L17.2 12.5L16 10.5Z"
            fill="#38BDF8"
          />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  );
}
