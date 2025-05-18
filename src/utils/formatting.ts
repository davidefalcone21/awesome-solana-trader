import logger from "./logger";

export function formatTicker(inputString: string): string {
    // Remove any leading dollar signs
    let formattedString = inputString.replace(/^\$/, '');
    // Convert to uppercase
    formattedString = formattedString.toUpperCase();
    // Add a single leading dollar sign
    return `$${formattedString}`;
  }
  export function multiplyByDecimal(amount: number, decimal: number): number {
    try {
      const multiplier = Math.pow(10, decimal); // Compute 10^decimal
      return amount * multiplier;
    } catch (error) {
      logger.error({ error: error }, `Error in multiplying by decimal: ${error}`);
      return amount;
    }
  }
  export function divisionByDecimal(amount: number, decimal: number): number {
    try {
      const multiplier = Math.pow(10, decimal); // Compute 10^decimal
      return amount / multiplier;
    } catch (error) {
      logger.error({ error: error }, `Error in dividing by decimal: ${error}`);
      return amount;
    }
  }
  export function formatMarketCap(value: number | string): string | number {
    let numValue: number;
    try {
      // Attempt to convert the value to a float
      numValue = typeof value === 'string' ? parseFloat(value) : value;
      if (isNaN(numValue)) {
        throw new Error('Invalid number');
      }
    } catch (error) {
      // Return the value as is if it cannot be converted
      logger.error({ error: error }, `Error in formatting market cap: ${error}`);
      return value;
    }
    // Proceed with formatting as before
    if (numValue < 1_000) {
      return `${numValue}`; // Return the number as is for values less than 1000
    } else if (1_000 <= numValue && numValue < 1_000_000) {
      return `${(numValue / 1_000).toFixed(1)}k`; // Thousands
    } else if (1_000_000 <= numValue && numValue < 1_000_000_000) {
      return `${(numValue / 1_000_000).toFixed(1)}m`; // Millions
    } else if (1_000_000_000 <= numValue && numValue < 1_000_000_000_000) {
      return `${(numValue / 1_000_000_000).toFixed(1)}b`; // Billions
    } else {
      return `${(numValue / 1_000_000_000_000).toFixed(1)}t`; // Trillions
    }
  }
  export function fromPercSlipToDb(percentage: number): number {
    return percentage * 100; 
  }
  // Conversion helper functions
  export function fromDbToPercSlip(slippage: number): number {
    return slippage / 100; // Example: 500 -> 5%
  }
  export function fromDbToSol(value: number): number {
    return value / 1e9; 
  }
  // Helper function to convert SOL to a DB-compatible format
  export function fromSolToDb(value: number): number {
      return value * 1e9; 
    }
  export function escapeMarkdownV2(text: string): string {
      return text
        // .replace(/_/g, '\\_') // Escape underscores
        // .replace(/\*/g, '\\*') // Escape asterisks
        // .replace(/\[/g, '\\[') // Escape square brackets
        // .replace(/\]/g, '\\]') // Escape square brackets
        // .replace(/\(/g, '\\(') // Escape parentheses
        // .replace(/\)/g, '\\)') // Escape parentheses
        .replace(/~/g, '\\~') // Escape tilde
        // .replace(/`/g, '\\`') // Escape backticks
        .replace(/>/g, '\\>') // Escape greater-than
        .replace(/#/g, '\\#') // Escape hash
        .replace(/\+/g, '\\+') // Escape plus
        .replace(/-/g, '\\-') // Escape minus
        .replace(/=/g, '\\=') // Escape equals
        .replace(/\|/g, '\\|') // Escape pipe
        .replace(/\./g, '\\.') // Escape period
        .replace(/!/g, '\\!'); // Escape exclamation mark
    }
    export function escapeMarkdownV2Links(text: string): string {
      return text
        // .replace(/_/g, '\\_') // Escape underscores
        // .replace(/\*/g, '\\*') // Escape asterisks
        //.replace(/\[/g, '\\[') // Escape square brackets
        //.replace(/\]/g, '\\]') // Escape square brackets
        //.replace(/\(/g, '\\(') // Escape parentheses
        //.replace(/\)/g, '\\)') // Escape parentheses
        .replace(/~/g, '\\~') // Escape tilde
        // .replace(/`/g, '\\`') // Escape backticks
        .replace(/>/g, '\\>') // Escape greater-than
        .replace(/#/g, '\\#') // Escape hash
        .replace(/\+/g, '\\+') // Escape plus
        .replace(/-/g, '\\-') // Escape minus
        .replace(/=/g, '\\=') // Escape equals
        .replace(/\|/g, '\\|') // Escape pipe
        .replace(/\./g, '\\.') // Escape period
        .replace(/!/g, '\\!'); // Escape exclamation mark
    }
    