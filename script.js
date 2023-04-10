const TICKET_PRICE = 300;
const PUSTOVIT = 100000;

const selectWinner = (max) => {
  const min = 1;

  return Math.floor(Math.random() * (max - min + 1) + min);
};

const isMonocat = (description) => {
  // 🐈
  const emojis = description.match(/\p{Emoji}+/gu);

  return emojis && emojis[0].charCodeAt() === 55357;
};

const prettyPrintParticipants = (participants) => {
  const participantsScreen = document.querySelector('.participants');

  const htmlSource = Object.entries(participants)
    .map(([key, value]) => {
      return `<p class="participant">${key}: ${value}</p>`;
    })
    .join('');

  participantsScreen.innerHTML = `<h2>Participants</h2> ${htmlSource}`;
};

const collectKeys = (row) => {
  const [
    dateAndTime,
    category,
    description,
    value,
    currency,
    cashback,
    remainder,
    id,
  ] = Object.keys(row);

  return {
    id,
    currency,
    dateAndTime,
    remainder,
    category,
    cashback,
    description,
    value,
  };
};

const parseSheet = async (file) => {
  const data = await file.arrayBuffer();

  const workbook = XLSX.read(data);

  const result = {};

  workbook.SheetNames.forEach((sheetName) => {
    const roa = XLSX.utils.sheet_to_row_object_array(
      workbook.Sheets[sheetName]
    );

    if (roa.length > 0) {
      result[sheetName] = roa;
    }
  });

  return result.statement;
};

document.addEventListener('DOMContentLoaded', () => {
  const sheetLoader = document.querySelector('.sheet-loader');
  const winnerScreen = document.querySelector('.winner');

  const ticketsToRender = {};

  sheetLoader.addEventListener('change', async (ev) => {
    const data = await parseSheet(sheetLoader.files[0]);
    const sheetKeys = collectKeys(data[0]);

    const lotteryParticipants = data.filter((record) => {
      return (
        parseInt(record[sheetKeys.dateAndTime]) > 6 &&
        record[sheetKeys.value] >= TICKET_PRICE &&
        !isMonocat(record[sheetKeys.description]) &&
        record[sheetKeys.value] !== PUSTOVIT
      );
    });

    const tickets = lotteryParticipants.reduce((acc, participant) => {
      const usersTickets = parseInt(
        participant[sheetKeys.value] / TICKET_PRICE
      );

      ticketsToRender[participant[sheetKeys.description]] = usersTickets;

      if (usersTickets === 1) {
        return [...acc, participant];
      }

      const duplicates = Array.from({ length: usersTickets }).fill(participant);

      return [...acc, ...duplicates];
    }, []);

    const winnerTicket = selectWinner(tickets.length);

    const winner = tickets[winnerTicket];

    console.log(ticketsToRender);

    console.log({
      totalTickets: tickets.length,
      winnerTicket,
      winner: winner[sheetKeys.description],
    });

    winnerScreen.innerHTML = `<h2>Winner!<h2> <p>Ticket number: ${winnerTicket}</p><p>${
      winner[sheetKeys.description]
    }</p>`;

    prettyPrintParticipants(ticketsToRender);
  });
});
