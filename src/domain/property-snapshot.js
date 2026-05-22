import { calculateEtr, sumRates } from "../format.js";
import {
  latestKnown,
  percentChange,
  previousKnown,
  sortHistoryAscending
} from "../calculations/history.js";
import { getTaxpayerJourneyRoutes } from "../config/taxpayer-journey.js";
import { buildAssessmentNoticeModel } from "../data/notice-model.js";
import { buildReviewSignalModel } from "../data/review-signal-model.js";

function normalizeProperty(propertyData, recordCard) {
  return {
    parcelId: propertyData.parcel.parcelId,
    owner: propertyData.parcel.owner,
    situsAddress: propertyData.parcel.situsAddress,
    countyName: propertyData.parcel.countyName,
    taxDistrict: propertyData.parcel.taxDistrict,
    schoolDistrict: propertyData.parcel.schoolDistrict,
    propertyClass: propertyData.classification.propertyClass,
    location: propertyData.classification.location,
    valuationGroup: recordCard?.locationModel?.valuationGroup ?? null,
    recordSource: recordCard?.source?.displayCitation ?? "MIPS property record card"
  };
}

function deriveAssessment(propertyData, recordCard) {
  const snapshot = propertyData.taxpayerHistory.find(row => row.year === propertyData.snapshotYear)
    ?? sortHistoryAscending(propertyData.taxpayerHistory).at(-1);
  const latestValue = latestKnown(propertyData.taxpayerHistory, "assessedValue");
  const priorValue = previousKnown(propertyData.taxpayerHistory, latestValue?.year, "assessedValue");

  return {
    snapshotYear: propertyData.snapshotYear,
    latestKnownValueYear: latestValue?.year ?? null,
    latestKnownValue: latestValue?.assessedValue ?? null,
    previousKnownValue: priorValue?.assessedValue ?? null,
    valueChangeFromPrevious: percentChange(latestValue?.assessedValue, priorValue?.assessedValue),
    currentYearStatus: snapshot?.status ?? "unknown",
    noticeValues: recordCard?.currentCardValue ?? null
  };
}

function deriveTaxes(propertyData) {
  const latestTax = latestKnown(propertyData.taxpayerHistory, "taxes");
  const previousTax = previousKnown(propertyData.taxpayerHistory, latestTax?.year, "taxes");
  const latestEtr = calculateEtr(latestTax);

  return {
    latestFinalTaxYear: propertyData.latestFinalTaxYear,
    latestFinalTax: latestTax?.taxes ?? null,
    previousFinalTax: previousTax?.taxes ?? null,
    taxChangeFromPrevious: percentChange(latestTax?.taxes, previousTax?.taxes),
    latestEffectiveTaxRate: latestEtr,
    latestFinalLevy: sumRates(propertyData.latestFinalLevyComponents)
  };
}

function deriveDistrict(propertyData, taxDistrictAuthorities) {
  const district = taxDistrictAuthorities?.districts?.find(item =>
    String(item.taxDistrict) === String(propertyData.parcel.taxDistrict)
  );

  return {
    taxDistrict: propertyData.parcel.taxDistrict,
    districtDescription: district?.districtDescription ?? null,
    districtReportLabel: district?.districtLabel ?? null,
    authorityCount: district?.authorityCount ?? propertyData.latestFinalLevyComponents.length,
    districtLevy: district?.districtLevy ?? sumRates(propertyData.latestFinalLevyComponents),
    authorities: district?.authorities ?? propertyData.latestFinalLevyComponents
  };
}

function buildViewModels(propertyData, recordCard, taxDistrictAuthorities, calendar) {
  return {
    notice: buildAssessmentNoticeModel(propertyData, recordCard, calendar),
    property: normalizeProperty(propertyData, recordCard),
    assessment: deriveAssessment(propertyData, recordCard),
    taxes: deriveTaxes(propertyData),
    district: deriveDistrict(propertyData, taxDistrictAuthorities),
    reviewSignals: buildReviewSignalModel(propertyData, recordCard)
  };
}

export function buildPropertySnapshotModel({
  propertyData,
  recordCard,
  calendar,
  ctlData,
  ratioData,
  countyContext,
  padRatioData,
  taxDistrictAuthorities,
  valuationGroups,
  iaaoStandards
}) {
  return {
    pipeline: "raw JSON -> normalized property snapshot model -> derived metrics -> view-specific data objects -> UI sections",
    sections: getTaxpayerJourneyRoutes(),
    rawSources: {
      propertyRecord: recordCard?.source?.displayCitation ?? "MIPS property record card",
      ctlYears: ctlData?.statewide?.map(row => row.year) ?? [],
      ratioYears: ratioData?.classes?.[0]?.records?.map(row => row.year) ?? [],
      calendar: calendar?.sourceTitle ?? "PAD calendar",
      countyContext: countyContext?.source?.title ?? "County context",
      marketArea: padRatioData?.source?.title ?? "PAD Reports and Opinions"
    },
    viewModels: buildViewModels(propertyData, recordCard, taxDistrictAuthorities, calendar),
    staticReference: {
      calendar,
      valuationGroups,
      iaaoStandards
    }
  };
}

export function withSnapshotModel(propertyData, snapshotModel) {
  return {
    ...propertyData,
    snapshotModel
  };
}
