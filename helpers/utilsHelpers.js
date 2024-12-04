import chalk from 'chalk';

export const chalkConsole = (message, color = 'white') => {
  if (chalk[color]) {
    console.log(chalk[color](message));
  } else {
    console.log(chalk.white(message)); // Default to white if the color is invalid
  }
};