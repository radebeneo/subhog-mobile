import { icons } from "@/config/icons";
import { useCallback, useState } from "react";
import type { ImageSourcePropType } from "react-native";
import { Image, View } from "react-native";
import { SvgUri } from "react-native-svg";

interface SubscriptionIconProps {
  source: ImageSourcePropType;
  size: number;
  className: string;
}

const getRemoteUri = (source: ImageSourcePropType) => {
  if (
    typeof source === "object" &&
    source !== null &&
    !Array.isArray(source) &&
    "uri" in source &&
    typeof source.uri === "string"
  ) {
    return source.uri;
  }

  return null;
};

const SubscriptionIcon = ({
  source,
  size,
  className,
}: SubscriptionIconProps) => {
  const uri = getRemoteUri(source);
  const [failedSource, setFailedSource] = useState<ImageSourcePropType | null>(null);
  const onError = useCallback(() => setFailedSource(source), [source]);
  const dimensions = { width: size, height: size };
  const fallback = <Image source={icons.wallet} style={dimensions} resizeMode="contain" />;

  return (
    <View className={className} style={dimensions}>
      {failedSource === source ? fallback : uri && /\.svg(?:[?#]|$)/i.test(uri) ? (
        <SvgUri
          key={uri}
          uri={uri}
          width={size}
          height={size}
          onError={onError}
          fallback={fallback}
        />
      ) : (
        <Image
          source={source}
          style={dimensions}
          resizeMode="contain"
          onError={onError}
        />
      )}
    </View>
  );
};

export default SubscriptionIcon;
