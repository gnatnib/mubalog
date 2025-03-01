export const getProvince = () => {
  return [
    { id: "11", name: "aceh" },
    { id: "12", name: "sumatera utara" },
    { id: "13", name: "sumatera barat" },
    { id: "14", name: "riau" },
    { id: "15", name: "jambi" },
    { id: "16", name: "sumatera selatan" },
    { id: "17", name: "bengkulu" },
    { id: "18", name: "lampung" },
    { id: "19", name: "kepulauan bangka belitung" },
    { id: "21", name: "kepulauan riau" },
    { id: "31", name: "dki jakarta" },
    { id: "32", name: "jawa barat" },
    { id: "33", name: "jawa tengah" },
    { id: "34", name: "di yogyakarta" },
    { id: "35", name: "jawa timur" },
    { id: "36", name: "banten" },
    { id: "51", name: "bali" },
    { id: "52", name: "nusa tenggara barat" },
    { id: "53", name: "nusa tenggara timur" },
    { id: "61", name: "kalimantan barat" },
    { id: "62", name: "kalimantan tengah" },
    { id: "63", name: "kalimantan selatan" },
    { id: "64", name: "kalimantan timur" },
    { id: "65", name: "kalimantan utara" },
    { id: "71", name: "sulawesi utara" },
    { id: "72", name: "sulawesi tengah" },
    { id: "73", name: "sulawesi selatan" },
    { id: "74", name: "sulawesi tenggara" },
    { id: "75", name: "gorontalo" },
    { id: "76", name: "sulawesi barat" },
    { id: "81", name: "maluku" },
    { id: "82", name: "maluku utara" },
    { id: "91", name: "papua barat" },
    { id: "94", name: "papua" },
  ]
}

export const searchProvince = (name: string) => {
  return getProvince().find((province) => province.name === name)
}

