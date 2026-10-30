/**
 * Maps technical maintenance terminology to plain-language descriptions.
 */

const JARGON_MAP = [
  // Plumbing
  { regex: /auger(ed)?|snake(d)?/gi, replace: 'cleared using a drain pipe unclogging cable' },
  { regex: /calcified\s+(sediment|obstruction|deposit)/gi, replace: 'hard water scaling and lime buildup' },
  { regex: /p-trap/gi, replace: 'curved drain pipe under the sink' },
  { regex: /ptfe|teflon\s+thread\s+sealant/gi, replace: 'waterproof pipe seal tape' },
  { regex: /ballcock|float\s+valve/gi, replace: 'toilet tank water refill valve' },
  { regex: /flushometer/gi, replace: 'toilet flush valve mechanism' },
  { regex: /faucet\s+aerator/gi, replace: 'mesh nozzle filter on the tap' },
  { regex: /reseated/gi, replace: 'realigned and tightly fastened' },
  { regex: /hydrostatic\s+pressure/gi, replace: 'water pipe pressure' },

  // Electrical
  { regex: /thermal\s+overload\s+relay/gi, replace: 'heat safety shutoff switch' },
  { regex: /mcb|miniature\s+circuit\s+breaker/gi, replace: 'electrical safety trip switch' },
  { regex: /rcd|elcb|residual\s+current/gi, replace: 'shock-prevention safety switch' },
  { regex: /capacitor\s+(bank|replaced)?/gi, replace: 'energy starter unit' },
  { regex: /fluorescent\s+troffer|ballast/gi, replace: 'ceiling light regulator unit' },
  { regex: /short\s+circuit\s+fault\s+isolated/gi, replace: 'wire sparking hazard identified and removed' },
  { regex: /grounding|earthing\s+resistance/gi, replace: 'electrical shock grounding connection' },

  // HVAC / Air Conditioning / Ventilation
  { regex: /refrigerant\s+pressure\s+normalized/gi, replace: 'cooling gas level refilled and balanced' },
  { regex: /evaporator\s+coil\s+de-iced/gi, replace: 'frost cleared from the internal cooling fins' },
  { regex: /compressor\s+duty\s+cycle/gi, replace: 'AC cooling motor operation' },
  { regex: /condenser\s+fins\s+straightened/gi, replace: 'outdoor AC cooling grid cleaned and straightened' },
  { regex: /thermostat\s+calibration/gi, replace: 'temperature sensor tuned' },

  // Networking / Wi-Fi
  { regex: /rj45\s+keystone\s+termination/gi, replace: 'wall internet port connector' },
  { regex: /cat6\s+patch\s+cable\s+re-crimped/gi, replace: 'LAN internet wire end renewed' },
  { regex: /dhcp\s+lease\s+exhaustion/gi, replace: 'Wi-Fi IP address congestion resolved' },
  { regex: /ap\s+re-provisioned|access\s+point/gi, replace: 'Wi-Fi antenna rebooted and reconfigured' },
  { regex: /attenuation\s+loss/gi, replace: 'signal interference' },

  // Carpentry & Furniture
  { regex: /hydraulic\s+damper|door\s+closer/gi, replace: 'automatic smooth door closing arm' },
  { regex: /mortise\s+lockset/gi, replace: 'room door handle and key lock' },
  { regex: /hinge\s+pinion/gi, replace: 'door hinge joint' },
  { regex: /drawer\s+telescopic\s+runner/gi, replace: 'drawer sliding roller rail' }
];

/**
 * Simplifies a single text string by substituting known technical phrases.
 */
export const simplifyText = (text) => {
  if (!text) return '';
  let simplified = text;
  JARGON_MAP.forEach(({ regex, replace }) => {
    simplified = simplified.replace(regex, replace);
  });
  return simplified;
};

/**
 * Generates an intuitive structured explanation for any technical update.
 */
export const getStructuredPlainLanguageUpdate = (rawText, status, category) => {
  if (!rawText) {
    if (status === 'RESOLVED') {
      return {
        summary: 'Maintenance has completed all necessary repairs for this issue.',
        actionTaken: 'Repairs finished and verified working by hostel maintenance.',
        whatItMeans: 'You can now use your room facilities normally. Please inspect and rate the repair.'
      };
    }
    if (status === 'IN_PROGRESS') {
      return {
        summary: 'A technician is currently working on your reported issue.',
        actionTaken: 'Technician has arrived or is actively sourcing parts to fix this.',
        whatItMeans: 'Please allow some time for work to finish. Your room will be attended to promptly.'
      };
    }
    return {
      summary: 'Your complaint is being reviewed by hostel management.',
      actionTaken: 'Ticket registered in the maintenance queue.',
      whatItMeans: 'A staff technician will be assigned according to priority.'
    };
  }

  const plainText = simplifyText(rawText);

  // Derive meaningful practical advice based on category
  let whatItMeans = 'The repairs are in progress or finished. Everything is being handled safely.';
  if (category === 'PLUMBING' || /leak|pipe|drain|water|tap/i.test(rawText)) {
    whatItMeans = 'Water supply and drainage are restored. Please check if taps run smoothly without leaking.';
  } else if (category === 'ELECTRICAL' || /switch|wire|light|power|fan/i.test(rawText)) {
    whatItMeans = 'Electrical safety checks completed. Safe to turn on room appliances and switches.';
  } else if (category === 'NETWORK' || /wi-fi|internet|lan|router/i.test(rawText)) {
    whatItMeans = 'Internet connectivity is restored. Reconnect your phone or laptop to the hostel Wi-Fi.';
  } else if (category === 'FURNITURE' || /door|lock|bed|table|drawer/i.test(rawText)) {
    whatItMeans = 'Furniture hardware tightened and tested. Safe and sturdy to use.';
  }

  return {
    summary: plainText,
    actionTaken: `Maintenance work completed: ${plainText}`,
    whatItMeans
  };
};

