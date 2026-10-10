/**
 * Utility for consistent service scheduling and status evaluation
 * Priority Rule: Under Repair > Overdue/Due > Active/Upcoming
 */
export function getServiceScheduleInfo(vehicle) {
  if (!vehicle) {
    return {
      isUnderRepair: false,
      serviceState: 'None',
      daysDiff: null,
      displayStatus: 'Active',
      badgeClass: 'badge-active',
      nextServiceDate: null
    };
  }

  const isUnderRepair = vehicle.status === 'Under Repair';

  if (!vehicle.nextServiceDate || typeof vehicle.nextServiceDate !== 'string') {
    return {
      isUnderRepair,
      serviceState: 'None',
      daysDiff: null,
      displayStatus: isUnderRepair ? 'Under Repair' : (vehicle.status || 'Active'),
      badgeClass: isUnderRepair ? 'badge-danger' : 'badge-active',
      nextServiceDate: null
    };
  }

  // Timezone-safe YYYY-MM-DD parsing
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(vehicle.nextServiceDate.trim());
  if (!match) {
    return {
      isUnderRepair,
      serviceState: 'None',
      daysDiff: null,
      displayStatus: isUnderRepair ? 'Under Repair' : (vehicle.status || 'Active'),
      badgeClass: isUnderRepair ? 'badge-danger' : 'badge-active',
      nextServiceDate: vehicle.nextServiceDate
    };
  }

  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);
  const targetDate = new Date(year, month - 1, day, 0, 0, 0, 0);

  // Validate calendar bounds (e.g. Feb 31 -> Mar 3 is caught)
  if (targetDate.getFullYear() !== year || targetDate.getMonth() !== month - 1 || targetDate.getDate() !== day) {
    return {
      isUnderRepair,
      serviceState: 'None',
      daysDiff: null,
      displayStatus: isUnderRepair ? 'Under Repair' : (vehicle.status || 'Active'),
      badgeClass: isUnderRepair ? 'badge-danger' : 'badge-active',
      nextServiceDate: vehicle.nextServiceDate
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  let serviceState = 'Upcoming';
  if (diffDays < 0) {
    serviceState = 'Overdue';
  } else if (diffDays <= 7) {
    serviceState = 'Due';
  } else {
    serviceState = 'Upcoming';
  }

  let displayStatus = vehicle.status;
  let badgeClass = 'badge-active';

  // Under Repair has top priority over service due
  if (isUnderRepair) {
    displayStatus = 'Under Repair';
    badgeClass = 'badge-danger';
  } else if (serviceState === 'Overdue') {
    displayStatus = 'Service Due';
    badgeClass = 'badge-danger';
  } else if (serviceState === 'Due') {
    displayStatus = 'Service Due';
    badgeClass = 'badge-warning';
  } else {
    displayStatus = 'Active';
    badgeClass = 'badge-active';
  }

  return {
    isUnderRepair,
    serviceState, // 'Overdue' | 'Due' | 'Upcoming' | 'None'
    daysDiff: diffDays,
    displayStatus, // 'Under Repair' | 'Service Due' | 'Active'
    badgeClass,
    nextServiceDate: vehicle.nextServiceDate
  };
}
