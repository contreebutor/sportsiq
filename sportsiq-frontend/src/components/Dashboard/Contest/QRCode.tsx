import { QRCodeSVG } from "qrcode.react";

interface Props {
  value: string;
  size?: number;
}

export default function QRCode({ value, size = 220 }: Props) {
  return (
    <>
      <QRCodeSVG value={value} size={size} fgColor="#5545D3" />
    </>
  );
}
