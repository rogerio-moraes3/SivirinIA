import Image from "next/image";
import { brand } from "@/lib/brand";
export function Brand() {
  return (
    <span className="brand">
      {brand.logo ? (
        <Image src={brand.logo} width={38} height={38} alt="" />
      ) : (
        <span className="brand-mark" aria-hidden="true">
          S
        </span>
      )}
      {brand.name}
    </span>
  );
}
