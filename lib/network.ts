import axios from "axios"
import type { PrayTime, RegionData } from "./interfaces"

export const searchCity = async (provinceId: string): Promise<RegionData[]> => {
  try {
    const response = await axios.post(
      "https://bimasislam.kemenag.go.id/ajax/getKabkoshalat",
      {
        x: provinceId,
      },
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      },
    )

    const result: RegionData[] = []
    const regex = /(<option value="(.*?)">(.*?)<\/option>)/gm
    let tempLooping

    while ((tempLooping = regex.exec(response.data)) !== null) {
      if (tempLooping.index === regex.lastIndex) {
        regex.lastIndex++
      }

      const temp: RegionData = { id: "", name: "" }
      tempLooping.forEach((match, groupIndex) => {
        if (groupIndex === 2) temp.id = match
        else if (groupIndex === 3) temp.name = match.toLowerCase()
      })

      result.push(temp)
    }

    return result
  } catch (error) {
    console.error("Error fetching cities:", error)
    return []
  }
}

export const searchPrayTime = async (
  provinceId: string,
  cityId: string,
  month: string,
  year: string,
): Promise<PrayTime[]> => {
  try {
    const response = await axios.post(
      "https://bimasislam.kemenag.go.id/ajax/getShalatbln",
      {
        x: provinceId,
        y: cityId,
        bln: month,
        thn: year,
      },
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      },
    )

    if (!response.data.data) {
      return []
    }

    const result: PrayTime[] = []
    const keys = Object.keys(response.data.data)

    keys.forEach((key) => {
      const time: PrayTime = { key, ...response.data.data[key] }
      result.push(time)
    })

    return result
  } catch (error) {
    console.error("Error fetching prayer times:", error)
    return []
  }
}

