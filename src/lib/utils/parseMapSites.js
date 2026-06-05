/**
 * @param {Record<string, string>[]} rows
 */
export function parseGeocodedSites(rows) {
	return rows
		.map((row, index) => {
			const id = row.Institution?.trim() ?? '';
			const lat = Number(row['Geocodio Latitude']);
			const lon = Number(row['Geocodio Longitude']);
			return {
				key: `${id}|${lat}|${lon}|${index}`,
				id,
				city: row.City?.trim() ?? '',
				state: row.State?.trim() ?? '',
				lat,
				lon
			};
		})
		.filter((site) => site.id && !Number.isNaN(site.lat) && !Number.isNaN(site.lon));
}
