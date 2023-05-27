//@ts-check
const TICKET_PRICE = 300;

const selectTicket = (max) => {
  const min = 1;

  return Math.floor(Math.random() * (max - min + 1) + min);
};

const selectWinners = (tickets, sheetKeys, { numberOfWinners }) => {
  let clonedTickets = [...tickets];
  const winners = [];

  while (winners.length < numberOfWinners) {
    const ticket = selectTicket(clonedTickets.length);
    const winner = clonedTickets[ticket];
    winners.push(winner);
    clonedTickets = clonedTickets.filter(
      (ticket) =>
        ticket[sheetKeys.description] !== winner[sheetKeys.description]
    );
  }

  return winners;
};

const isMonocat = (description) => {
  const emojis = description.match(/\p{Emoji}+/gu); // 🐈

  return emojis && emojis[0].charCodeAt() === 55357;
};

const isMe = (description) => {
  return description === 'З платинової картки';
};

const isPrivateBank = (description) => {
  return description === 'Від: P24 CR MD UA';
};

const hasCorrectDescription = (description) => {
  return (
    !isMonocat(description) && !isMe(description) && !isPrivateBank(description)
  );
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
    const row = XLSX.utils.sheet_to_row_object_array(
      workbook.Sheets[sheetName]
    );

    if (row.length > 0) {
      result[sheetName] = row;
    }
  });

  return result.statement;
};

const isCorrectRecord = (record, sheetKeys) => {
  return (
    record[sheetKeys.value] >= 0 &&
    hasCorrectDescription(record[sheetKeys.description])
  );
};

const renderWinners = (winners, sheetKeys) => {
  return winners
    .map((winner) => `<p>🤑 ${winner[sheetKeys.description]}</p>`)
    .join('');
};

const createTickets = (participants, sheetKeys) => {
  const toLog = {};

  const donations = participants.reduce((acc, participant) => {
    const key = participant[sheetKeys.description];
    const existingTickets = acc[key] || 0;

    return {
      ...acc,
      [key]: existingTickets + participant[sheetKeys.value],
    };
  }, {});

  const results = participants
    .filter((participant) => {
      return donations[participant[sheetKeys.description]] >= TICKET_PRICE;
    })
    .map((participant) => {
      const tickets = Math.trunc(
        donations[participant[sheetKeys.description]] / TICKET_PRICE
      );

      const duplicates = Array.from({ length: tickets }).fill(participant);

      toLog[participant[sheetKeys.description]] = duplicates.length;

      return duplicates;
    })
    .flat();

  console.log({ tickets: toLog, donations });

  return results;
};

document.addEventListener('DOMContentLoaded', () => {
  const sheetLoader = document.querySelector('.sheet-loader');
  const winnerScreen = document.querySelector('.winner');
  const participantsScreen = document.querySelector('.participants');
  const drumRoller = document.getElementById('drum-roller');

  const roll = async () => {
    const numberOfWinners =
      document.querySelector('.number-of-winners').value || 1;

    const parsedSheet = await parseSheet(sheetLoader.files[0]);
    const sheetKeys = collectKeys(parsedSheet[0]);

    const lotteryParticipants = parsedSheet.filter((record) =>
      isCorrectRecord(record, sheetKeys)
    );

    const tickets = createTickets(lotteryParticipants, sheetKeys);
    const winners = selectWinners(tickets, sheetKeys, { numberOfWinners });

    participantsScreen.innerHTML = `<h2>Total tickets: ${tickets.length}</h2>`;

    winnerScreen.innerHTML = `<h2>Aaaaaand... we have a winner!<h2> ${renderWinners(
      winners,
      sheetKeys
    )}`;
  };

  drumRoller.addEventListener('click', roll);
});
