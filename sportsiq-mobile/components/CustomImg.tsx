import { Image } from "expo-image";
import React, { useEffect, useState } from "react";
import { SvgProps, SvgXml } from "react-native-svg";

const RASTER_EXT = /\.(png|jpe?g|webp|gif)(\?|$)/i;

function isRasterUri(uri: string): boolean {
  return RASTER_EXT.test(uri);
}

type Props = {
  uri?: string;
  xml?: string;
  icon?: React.FC<SvgProps>;
  size?: number;
  width?: number;
  height?: number;
  color?: string;
};

export default function CustomImg({
  uri,
  xml,
  icon: Icon,
  size = 24,
  width,
  height,
  color,
}: Props) {
  const w = width ?? size;
  const h = height ?? size;

  const [remoteXml, setRemoteXml] = useState<string | null>(null);
  const [remoteError, setRemoteError] = useState(false);

  const isRaster = uri != null && isRasterUri(uri);

  useEffect(() => {
    if (!uri || isRasterUri(uri)) {
      setRemoteXml(null);
      setRemoteError(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(uri);
        const text = await res.text();
        if (!cancelled) {
          setRemoteXml(text);
          setRemoteError(false);
        }
      } catch {
        if (!cancelled) {
          setRemoteXml(null);
          setRemoteError(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [uri]);

  // Raster image (PNG, JPEG, WebP, GIF)
  if (uri && isRaster) {
    return (
      <Image
        source={{ uri }}
        style={{ width: w, height: h }}
        contentFit="contain"
      />
    );
  }

  // Online SVG (fetched as XML)
  if (uri && remoteXml && !remoteError) {
    return <SvgXml xml={remoteXml} width={w} height={h} />;
  }

  // SVG XML string passed directly
  if (xml) {
    return <SvgXml xml={xml} width={w} height={h} />;
  }

  // Local SVG
  if (Icon) {
    return <Icon width={w} height={h} fill={color} />;
  }

  return null;
}
