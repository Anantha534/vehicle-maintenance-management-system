/**
 * server/validation.js
 * Comprehensive validation utilities for Vehicles, Maintenance, Spare Parts, and Dates.
 */

// Strict YYYY-MM-DD parsing with calendar validity check (handles leap years, month bounds)
export function parseDateOnly(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const trimmed = dateStr.trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (!match) return null;

  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);

  if (year < 1900 || year > 2100) return null;
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > 31) return null;

  const date = new Date(year, month - 1, day, 0, 0, 0, 0);
  // Verify date round-tripped correctly (e.g. Feb 31 -> Mar 3 is caught)
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }
  return date;
}

export function isValidDateString(dateStr) {
  return parseDateOnly(dateStr) !== null;
}

// Consistent service scheduling state calculation
export function computeServiceState(nextServiceDate) {
  if (!nextServiceDate || typeof nextServiceDate !== 'string') {
    return { state: 'None', daysDiff: null };
  }
  const dateObj = parseDateOnly(nextServiceDate);
  if (!dateObj) {
    return { state: 'None', daysDiff: null };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffTime = dateObj.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  let state = 'Upcoming';
  if (diffDays < 0) {
    state = 'Overdue';
  } else if (diffDays <= 7) {
    state = 'Due';
  } else {
    state = 'Upcoming';
  }
  return { state, daysDiff: diffDays };
}

export const ALLOWED_VEHICLE_TYPES = ['Car', 'Scooter', 'Van', 'Truck', 'Bus', 'Bike'];
export const ALLOWED_FUEL_TYPES = ['Petrol', 'Diesel', 'Electric', 'CNG', 'Hybrid'];
export const ALLOWED_VEHICLE_STATUSES = ['Active', 'Service Due', 'Under Repair'];
export const ALLOWED_MAINTENANCE_TYPES = ['Service', 'Repair', 'Inspection'];
export const ALLOWED_MAINTENANCE_STATUSES = ['Completed', 'In Progress', 'Scheduled'];

function findCaseInsensitiveMatch(val, allowedList) {
  if (typeof val !== 'string') return null;
  const lower = val.trim().toLowerCase();
  return allowedList.find(item => item.toLowerCase() === lower) || null;
}

// ---------- Vehicle Payload Validator ----------
export function validateVehiclePayload(body, { isUpdate = false } = {}) {
  const errors = [];
  const sanitized = {};

  // regNo
  if (!isUpdate || body.regNo !== undefined) {
    if (body.regNo === undefined || body.regNo === null || String(body.regNo).trim() === '') {
      errors.push('Registration number is required and cannot be whitespace only');
    } else {
      const regTrimmed = String(body.regNo).trim().toUpperCase();
      if (regTrimmed.length < 2 || regTrimmed.length > 20) {
        errors.push('Registration number must be between 2 and 20 characters');
      } else if (!/^[A-Z0-9\-\s_]+$/.test(regTrimmed)) {
        errors.push('Registration number may only contain alphanumeric characters, hyphens, underscores, and spaces');
      } else {
        sanitized.regNo = regTrimmed;
      }
    }
  }

  // make
  if (!isUpdate || body.make !== undefined) {
    if (body.make === undefined || body.make === null || String(body.make).trim() === '') {
      errors.push('Make (brand) is required and cannot be whitespace only');
    } else {
      const makeTrimmed = String(body.make).trim();
      if (makeTrimmed.length > 50) {
        errors.push('Make must not exceed 50 characters');
      } else {
        sanitized.make = makeTrimmed;
      }
    }
  }

  // model
  if (!isUpdate || body.model !== undefined) {
    if (body.model === undefined || body.model === null || String(body.model).trim() === '') {
      errors.push('Model is required and cannot be whitespace only');
    } else {
      const modelTrimmed = String(body.model).trim();
      if (modelTrimmed.length > 50) {
        errors.push('Model must not exceed 50 characters');
      } else {
        sanitized.model = modelTrimmed;
      }
    }
  }

  // type
  if (body.type !== undefined) {
    const matchedType = findCaseInsensitiveMatch(body.type, ALLOWED_VEHICLE_TYPES);
    if (!matchedType) {
      errors.push(`Invalid vehicle type. Allowed types: ${ALLOWED_VEHICLE_TYPES.join(', ')}`);
    } else {
      sanitized.type = matchedType;
    }
  } else if (!isUpdate) {
    sanitized.type = 'Car';
  }

  // fuelType
  if (body.fuelType !== undefined) {
    const matchedFuel = findCaseInsensitiveMatch(body.fuelType, ALLOWED_FUEL_TYPES);
    if (!matchedFuel) {
      errors.push(`Invalid fuel type. Allowed types: ${ALLOWED_FUEL_TYPES.join(', ')}`);
    } else {
      sanitized.fuelType = matchedFuel;
    }
  } else if (!isUpdate) {
    sanitized.fuelType = 'Petrol';
  }

  // year
  const currentYear = new Date().getFullYear();
  if (body.year !== undefined && body.year !== null && String(body.year).trim() !== '') {
    const numYear = Number(body.year);
    if (!Number.isInteger(numYear) || numYear < 1900 || numYear > currentYear + 2) {
      errors.push(`Manufacturing year must be a valid whole year between 1900 and ${currentYear + 2}`);
    } else {
      sanitized.year = numYear;
    }
  } else if (!isUpdate) {
    sanitized.year = currentYear;
  }

  // mileage
  if (body.mileage !== undefined && body.mileage !== null && String(body.mileage).trim() !== '') {
    const numMileage = Number(body.mileage);
    if (!Number.isFinite(numMileage) || numMileage < 0 || !Number.isInteger(numMileage)) {
      errors.push('Mileage must be a non-negative whole number (0 or greater)');
    } else if (numMileage > 2000000) {
      errors.push('Mileage cannot exceed 2,000,000 km');
    } else {
      sanitized.mileage = numMileage;
    }
  } else if (!isUpdate) {
    sanitized.mileage = 0;
  }

  // status
  if (body.status !== undefined) {
    const matchedStatus = findCaseInsensitiveMatch(body.status, ALLOWED_VEHICLE_STATUSES);
    if (!matchedStatus) {
      errors.push(`Invalid vehicle status. Allowed statuses: ${ALLOWED_VEHICLE_STATUSES.join(', ')}`);
    } else {
      sanitized.status = matchedStatus;
    }
  } else if (!isUpdate) {
    sanitized.status = 'Active';
  }

  // Optional date fields
  const dateFields = [
    { key: 'nextServiceDate', label: 'Next service date' },
    { key: 'purchaseDate', label: 'Purchase date' },
    { key: 'insuranceExpiry', label: 'Insurance expiry date' }
  ];

  for (const { key, label } of dateFields) {
    if (body[key] !== undefined) {
      if (body[key] === null || String(body[key]).trim() === '') {
        sanitized[key] = null;
      } else {
        const trimmedDate = String(body[key]).trim();
        if (!isValidDateString(trimmedDate)) {
          errors.push(`${label} must be a valid calendar date in YYYY-MM-DD format`);
        } else {
          sanitized[key] = trimmedDate;
        }
      }
    } else if (!isUpdate) {
      sanitized[key] = null;
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    error: errors[0] || null,
    data: sanitized
  };
}

// ---------- Maintenance Payload Validator ----------
export function validateMaintenancePayload(body, { isUpdate = false } = {}) {
  const errors = [];
  const sanitized = {};

  // vehicleReg
  if (!isUpdate || body.vehicleReg !== undefined) {
    if (body.vehicleReg === undefined || body.vehicleReg === null || String(body.vehicleReg).trim() === '') {
      errors.push('Vehicle registration number is required');
    } else {
      sanitized.vehicleReg = String(body.vehicleReg).trim().toUpperCase();
    }
  }

  // vehicleName
  if (body.vehicleName !== undefined) {
    sanitized.vehicleName = body.vehicleName ? String(body.vehicleName).trim() : null;
  }

  // description
  if (!isUpdate || body.description !== undefined) {
    if (body.description === undefined || body.description === null || String(body.description).trim() === '') {
      errors.push('Description is required and cannot be whitespace only');
    } else {
      const descTrimmed = String(body.description).trim();
      if (descTrimmed.length < 3) {
        errors.push('Description must be at least 3 characters long');
      } else if (descTrimmed.length > 1000) {
        errors.push('Description must not exceed 1000 characters');
      } else {
        sanitized.description = descTrimmed;
      }
    }
  }

  // type
  if (body.type !== undefined) {
    const matchedType = findCaseInsensitiveMatch(body.type, ALLOWED_MAINTENANCE_TYPES);
    if (!matchedType) {
      errors.push(`Invalid maintenance type. Allowed types: ${ALLOWED_MAINTENANCE_TYPES.join(', ')}`);
    } else {
      sanitized.type = matchedType;
    }
  } else if (!isUpdate) {
    sanitized.type = 'Service';
  }

  // status
  if (body.status !== undefined) {
    const matchedStatus = findCaseInsensitiveMatch(body.status, ALLOWED_MAINTENANCE_STATUSES);
    if (!matchedStatus) {
      errors.push(`Invalid maintenance status. Allowed statuses: ${ALLOWED_MAINTENANCE_STATUSES.join(', ')}`);
    } else {
      sanitized.status = matchedStatus;
    }
  } else if (!isUpdate) {
    sanitized.status = 'Completed';
  }

  // cost
  if (body.cost !== undefined && body.cost !== null && String(body.cost).trim() !== '') {
    const numCost = Number(body.cost);
    if (!Number.isFinite(numCost) || numCost < 0) {
      errors.push('Cost must be a non-negative number (0 or greater)');
    } else if (numCost > 10000000) {
      errors.push('Cost cannot exceed ₹10,000,000');
    } else {
      sanitized.cost = Math.round(numCost * 100) / 100;
    }
  } else if (!isUpdate) {
    sanitized.cost = 0;
  }

  // mileage
  if (body.mileage !== undefined && body.mileage !== null && String(body.mileage).trim() !== '') {
    const numMileage = Number(body.mileage);
    if (!Number.isFinite(numMileage) || numMileage < 0 || !Number.isInteger(numMileage)) {
      errors.push('Mileage must be a non-negative whole number (0 or greater)');
    } else if (numMileage > 2000000) {
      errors.push('Mileage cannot exceed 2,000,000 km');
    } else {
      sanitized.mileage = numMileage;
    }
  }

  // serviceDate
  if (body.serviceDate !== undefined && body.serviceDate !== null && String(body.serviceDate).trim() !== '') {
    const trimmedDate = String(body.serviceDate).trim();
    if (!isValidDateString(trimmedDate)) {
      errors.push('Service date must be a valid calendar date in YYYY-MM-DD format');
    } else {
      sanitized.serviceDate = trimmedDate;
    }
  } else if (!isUpdate) {
    sanitized.serviceDate = new Date().toISOString().split('T')[0];
  }

  // nextServiceDate
  if (body.nextServiceDate !== undefined) {
    if (body.nextServiceDate === null || String(body.nextServiceDate).trim() === '') {
      sanitized.nextServiceDate = null;
    } else {
      const trimmedDate = String(body.nextServiceDate).trim();
      if (!isValidDateString(trimmedDate)) {
        errors.push('Next service date must be a valid calendar date in YYYY-MM-DD format');
      } else {
        sanitized.nextServiceDate = trimmedDate;
      }
    }
  } else if (!isUpdate) {
    sanitized.nextServiceDate = null;
  }

  return {
    valid: errors.length === 0,
    errors,
    error: errors[0] || null,
    data: sanitized
  };
}

// ---------- Spare Part Payload Validator ----------
export function validateSparePartPayload(body, { isUpdate = false } = {}) {
  const errors = [];
  const sanitized = {};

  // partName
  if (!isUpdate || body.partName !== undefined) {
    if (body.partName === undefined || body.partName === null || String(body.partName).trim() === '') {
      errors.push('Part name is required and cannot be whitespace only');
    } else {
      const nameTrimmed = String(body.partName).trim();
      if (nameTrimmed.length < 2 || nameTrimmed.length > 100) {
        errors.push('Part name must be between 2 and 100 characters');
      } else {
        sanitized.partName = nameTrimmed;
      }
    }
  }

  // vehicleReg
  if (!isUpdate || body.vehicleReg !== undefined) {
    if (body.vehicleReg === undefined || body.vehicleReg === null || String(body.vehicleReg).trim() === '') {
      errors.push('Vehicle registration number is required');
    } else {
      sanitized.vehicleReg = String(body.vehicleReg).trim().toUpperCase();
    }
  }

  // quantity
  if (!isUpdate || body.quantity !== undefined) {
    if (body.quantity === undefined || body.quantity === null || String(body.quantity).trim() === '') {
      if (!isUpdate) sanitized.quantity = 1;
    } else {
      const numQty = Number(body.quantity);
      if (!Number.isInteger(numQty) || numQty < 1) {
        errors.push('Quantity must be a positive whole number (at least 1)');
      } else if (numQty > 10000) {
        errors.push('Quantity cannot exceed 10,000');
      } else {
        sanitized.quantity = numQty;
      }
    }
  }

  // cost
  if (body.cost !== undefined && body.cost !== null && String(body.cost).trim() !== '') {
    const numCost = Number(body.cost);
    if (!Number.isFinite(numCost) || numCost < 0) {
      errors.push('Cost must be a non-negative number (0 or greater)');
    } else if (numCost > 10000000) {
      errors.push('Cost cannot exceed ₹10,000,000');
    } else {
      sanitized.cost = Math.round(numCost * 100) / 100;
    }
  } else if (!isUpdate) {
    sanitized.cost = 0;
  }

  // replacementDate
  if (body.replacementDate !== undefined && body.replacementDate !== null && String(body.replacementDate).trim() !== '') {
    const trimmedDate = String(body.replacementDate).trim();
    if (!isValidDateString(trimmedDate)) {
      errors.push('Replacement date must be a valid calendar date in YYYY-MM-DD format');
    } else {
      sanitized.replacementDate = trimmedDate;
    }
  } else if (!isUpdate) {
    sanitized.replacementDate = new Date().toISOString().split('T')[0];
  }

  return {
    valid: errors.length === 0,
    errors,
    error: errors[0] || null,
    data: sanitized
  };
}
