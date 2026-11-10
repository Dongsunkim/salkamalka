export function Illustration({ small = false }: { small?: boolean }) {
  return (
    <svg
      className={small ? 'illustration small' : 'illustration'}
      viewBox="0 0 250 210"
      fill="none"
      aria-hidden="true"
    >
      <ellipse cx="127" cy="181" rx="79" ry="10" fill="#E0E7D5" />
      <circle cx="128" cy="103" r="79" fill="#ECF0E3" />
      <path d="m73 87 89-13 21 96-100 5-10-88Z" fill="#A6BC8D" />
      <path d="m77 90 88-13 11 87-96 10-3-84Z" fill="#C3D4AE" />
      <path d="M99 89c-6-43 44-49 48-7" stroke="#396047" strokeWidth="7" strokeLinecap="round" />
      <path d="m91 127 76-10 7 45-81 9-2-44Z" fill="#DBE5C7" />
      <circle cx="172" cy="135" r="29" fill="#FCFAF0" stroke="#396047" strokeWidth="4" />
      <path
        d="M172 120v16l10 6"
        stroke="#396047"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M55 111c-18-19-22 7 0 17 22-12 17-36 0-17Z" fill="#F0BA9E" />
      <path d="m195 53 3 10 10 3-10 4-3 10-4-10-10-4 10-3 4-10Z" fill="#E3B873" />
      <path d="M71 53c5 0 7-3 7-7 0 4 3 7 7 7-4 0-7 3-7 7 0-4-2-7-7-7Z" fill="#71906B" />
      <path
        d="m130 135 7 6 12-15"
        stroke="#698158"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
