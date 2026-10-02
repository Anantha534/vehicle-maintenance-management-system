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

  if (!vehicle.nextServiceDate) {
    return {
      isUnderRepair,
      serviceState: 'None',
      daysDiff: null,
      displayStatus: isUnderRepair ? 'Under Repair' : (vehicle.status || 'Active'),
      badgeClass: isUnderRepair ? 'badge-danger' : 'badge-active',
      nextServiceDate: null
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const targetDate = new Date(vehicle.nextServiceDate);
  targetDate.setHours(0, 0, 0, 0);

  const diffTime = targetDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

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
    daysDiff,
    displayStatus, // 'Under Repair' | 'Service Due' | 'Active'
    badgeClass,
    nextServiceDate: vehicle.nextServiceDate
  };
}
