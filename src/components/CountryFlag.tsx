import Image from "next/image";

export function countryName(code: string) {
  try {
    return new Intl.DisplayNames(["es"], { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
}

/** Flag image (emoji flags render as bare letters on Windows) plus the country's Spanish name. */
export function CountryFlag({ code, showName = true }: { code: string; showName?: boolean }) {
  return (
    <span className="flex items-center gap-2 text-foreground">
      <Image
        src={`https://flagcdn.com/w40/${code.toLowerCase()}.png`}
        alt={showName ? "" : countryName(code)}
        width={20}
        height={15}
        className="h-[15px] w-5 object-cover outline outline-1 -outline-offset-1 outline-white/15"
        unoptimized
      />
      {showName && countryName(code)}
    </span>
  );
}
