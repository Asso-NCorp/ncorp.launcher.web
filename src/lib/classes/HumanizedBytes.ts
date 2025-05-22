export class HumanizedSize {
    static units: string[] = ['o', 'Ko', 'Mo', 'Go', 'To', 'Po', 'Eo'];
    static values: number[] = [1, 1024, 1024 ** 2, 1024 ** 3, 1024 ** 4, 1024 ** 5, 1024 ** 6];

    static humanize(size: number, decimals?: number | undefined): string {
        let i = 0;
        while (size >= this.values[i + 1]) {
            i++;
        }
        const value = size / this.values[i];

        if (decimals !== undefined) {
            return `${value.toFixed(decimals)} ${this.units[i]}`;
        }

        return `${value.toFixed(0)} ${this.units[i]}`;
    }
}