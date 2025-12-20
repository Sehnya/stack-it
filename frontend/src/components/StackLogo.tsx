interface StackLogoProps {
  size?: number
  className?: string
}

const StackLogo = ({ size = 28, className = '' }: StackLogoProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Top layer */}
    <path
      d="M25 25 Q25 20 30 20 L70 20 Q75 20 75 25 L75 35 Q75 40 70 40 L30 40 Q25 40 25 35 Z"
      fill="#1a1a1a"
      stroke="#1a1a1a"
      strokeWidth="1"
    />
    {/* Middle layer */}
    <path
      d="M20 42 Q15 45 20 50 L35 55 Q50 60 65 55 L80 50 Q85 45 80 42 L65 38 Q50 35 35 38 Z"
      fill="#1a1a1a"
      stroke="#1a1a1a"
      strokeWidth="1"
    />
    {/* Bottom layer */}
    <path
      d="M15 58 Q10 62 15 68 L30 75 Q50 82 70 75 L85 68 Q90 62 85 58 L70 52 Q50 48 30 52 Z"
      fill="#1a1a1a"
      stroke="#1a1a1a"
      strokeWidth="1"
    />
  </svg>
)

export default StackLogo
