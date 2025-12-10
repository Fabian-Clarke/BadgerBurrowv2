import * as Calendar from 'expo-calendar';
import { Platform } from 'react-native';

async function getOrCreateCalendarId() {
  const { status } = await Calendar.requestCalendarPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Calendar permission not granted');
  }

  const defaultCalendar = await Calendar.getDefaultCalendarAsync();
  let source = defaultCalendar?.source;

  if (Platform.OS === 'android' && !source) {
    source = { isLocalAccount: true, name: 'Badger Burrow' };
  }

  const calendars = await Calendar.getCalendarsAsync(
    Calendar.EntityTypes.EVENT
  );

  const existing = calendars.find(
    (cal) => cal.name === 'Badger Burrow' || cal.title === 'Badger Burrow'
  );

  if (existing) {
    return existing.id;
  }

  const newCalendarId = await Calendar.createCalendarAsync({
    title: 'Badger Burrow',
    name: 'Badger Burrow',
    color: '#c5050c',
    entityType: Calendar.EntityTypes.EVENT,
    sourceId: source?.id,
    source,
    ownerAccount: defaultCalendar?.ownerAccount || 'personal',
    accessLevel: Calendar.CalendarAccessLevel.OWNER,
  });

  return newCalendarId;
}

export async function addEventToCalendar(event) {
  const calendarId = await getOrCreateCalendarId();

  const {
    title,
    name,
    description,
    location,
    startDateTime,
    endDateTime,
  } = event;

  const eventTitle = title || name || 'Badger Burrow Event';

  let startDate;
  if (startDateTime?.toDate) {
    startDate = startDateTime.toDate();
  } else {
    startDate = new Date();
  }

  let endDate;
  if (endDateTime?.toDate) {
    endDate = endDateTime.toDate();
  } else {
    // Default to 1 hour after start
    endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
  }

  const details = {
    title: eventTitle,
    startDate,
    endDate,
    location: location || '',
    notes: description || '',
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };

  const eventId = await Calendar.createEventAsync(calendarId, details);
  return eventId;
}
