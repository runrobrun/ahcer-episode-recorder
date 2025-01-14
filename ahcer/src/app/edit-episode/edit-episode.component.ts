import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialog, MatDialogConfig, MatDialogRef} from "@angular/material/dialog";
import {UntypedFormBuilder, UntypedFormGroup, Validators} from "@angular/forms";
import firebase from "firebase/compat/app";
import Timestamp = firebase.firestore.Timestamp;
import {Episode} from "../models/episode";
import {EpisodeService} from "../services/episode.service";
import {MedicationService} from "../services/medication.service";
import {Medication} from "../models/medication";
import {CreateMedicationComponent} from "../create-medication/create-medication.component";
import {formGroupErrorMatcher} from "../create-episode/create-episode.component";

@Component({
  selector: 'app-edit-episode',
  templateUrl: './edit-episode.component.html',
  styleUrls: ['./edit-episode.component.scss']
})
export class EditEpisodeComponent implements OnInit {
  patientId: string;
  episode : Episode;

  rescueMedications: Medication[] = [];
  prescriptionMeds: any[] = [];
  archivedRescueMeds: Medication[] = [];
  loadingRescueMeds: boolean = false;
  loadingArchivedMeds: boolean = false;

  symptomLabels = ["Full Body", "Left Arm", "Right Arm", "Left Leg", "Right Leg",
    "Left Hand", "Right Hand", "Eyes", "Loss of Consciousness", "Seizure"];
  symptomKeys = ["fullBody", "leftArm", "rightArm", "leftLeg", "rightLeg",
    "leftHand", "rightHand", "eyes", "lossOfConsciousness", "seizure"];

  episodeForm : UntypedFormGroup;
  formGroupErrorMatcher: formGroupErrorMatcher = new formGroupErrorMatcher();

  symptomGroup(episode: Episode): UntypedFormGroup {
    let controls = {}
    for(let index in this.symptomLabels) {
      let label = this.symptomLabels[index];
      if(episode.symptoms && Object.keys(episode.symptoms[this.symptomKeys[index]]).length > 0) {
        if(label!="Loss of Consciousness" && label!="Seizure") {
          controls[label + ' Checkbox'] = true;
          controls[label + ' Dropdown'] = [episode.symptoms[this.symptomKeys[index]]['type']];
        }
        else {
          controls[label + ' Checkbox'] = [episode.symptoms[this.symptomKeys[index]]['type']];
        }
        controls[label + ' Time'] = [episode.symptoms[this.symptomKeys[index]]['time'].toDate()];
      }
      else {
        controls[label + ' Checkbox'] = false;
        if(label!="Loss of Consciousness" && label!="Seizure")
          controls[label + ' Dropdown'] = [''];
        controls[label + ' Time'] = [null];
      }
    }
    let options = {
      validators: (formGroup: UntypedFormGroup) => {
        let checked = 0;
        let errors = {};
        for (let label of this.symptomLabels) {
          let checkbox = formGroup.controls[label+' Checkbox']
          let checkboxChecked = (checkbox.value === true)
          let dropdownValueEmpty = false;
          if (label!="Seizure" && label!="Loss of Consciousness") {
            let dropdown = formGroup.controls[label + ' Dropdown']
            dropdownValueEmpty = (dropdown.value === '')
          }
          if(checkboxChecked) {
            checked++;
          }
          if (checkboxChecked && dropdownValueEmpty) {
            errors[label+' Dropdown Error']=true;
          }
        }
        if (checked < 1){
          return {
            requireCheckboxesToBeChecked: true
          };
        }
        else if(Object.keys(errors).length > 0) {
          return errors;
        }

        return null;
      }
    }
    return this.fb.group(controls, options);
  }

  rescueMedGroup(episode: Episode): UntypedFormGroup {
    let controls = {}
    let rescueMedDosesAndTimes = {};
    if(this.episode.medications && Object.keys(this.episode.medications).length > 0) {
      let medications = episode.medications;
      if (medications.rescueMeds) {
        for (let med of medications.rescueMeds) {
          rescueMedDosesAndTimes[med.id] = {doseInfo: med.doseInfo, time: med.time.toDate()};
        }
      }
    }

    for(let i=0; i < this.rescueMedications.length; i++) {
      let medication = this.rescueMedications[i];
      if(medication.id in rescueMedDosesAndTimes) {
        controls['med-'+i+'-checkbox'] = true;
        controls['med-'+i+'-dose-amount'] = [rescueMedDosesAndTimes[medication.id].doseInfo.amount];
        controls['med-'+i+'-dose-unit'] = [rescueMedDosesAndTimes[medication.id].doseInfo.unit];
        controls['med-'+i+'-time'] = [rescueMedDosesAndTimes[medication.id].time];
      }
      else {
        controls['med-' + i + '-checkbox'] = false;
        controls['med-' + i + '-dose-amount'] = [medication.doseInfo.amount];
        controls['med-' + i + '-dose-unit'] = [medication.doseInfo.unit];
        controls['med-' + i + '-time'] = null;
      }
    }
    for(let i=0; i < this.archivedRescueMeds.length; i++) {
      let medication = this.archivedRescueMeds[i];
      let controlIndex = i + this.rescueMedications.length;
      controls['med-'+controlIndex+'-checkbox'] = true;
      controls['med-'+controlIndex+'-dose-amount'] = [rescueMedDosesAndTimes[medication.id].doseInfo.amount];
      controls['med-'+controlIndex+'-dose-unit'] = [rescueMedDosesAndTimes[medication.id].doseInfo.unit];
      controls['med-'+controlIndex+'-time'] = [rescueMedDosesAndTimes[medication.id].time];

    }
    let options = {
      validators: this.rescueMedsValidator()
    }
    return this.fb.group(controls, options);
  }

  rescueMedsValidator() {
    return (formGroup: UntypedFormGroup) =>
    {
      let checked = 0;
      let errors = {};
      for (let i=0; i < this.rescueMedications.length; i++) {
        let checkbox = formGroup.controls['med-' + i + '-checkbox']
        let checkboxChecked = (checkbox?.value === true)
        let doseAmount = formGroup.controls['med-' + i + "-dose-amount"];
        let doseEmpty = (doseAmount?.value === null)

        if (checkboxChecked) {
          checked++;
        }
        if (checkboxChecked && doseEmpty) {
          errors['med-' + i + "-dose-amount Error"] = true;
        }
      }
      if (checked < 1) {
        return {
          requireCheckboxesToBeChecked: true
        };
      }
      else if(Object.keys(errors).length > 0) {
        return errors;
      }

      return null;
    }
  }

  prescriptionMedGroup(): UntypedFormGroup {
    let controls = {};
    for (let i=0; i < this.prescriptionMeds.length; i++) {
      controls[`med-${i}-name`] = [this.prescriptionMeds[i].name, Validators.required];
      controls[`med-${i}-dose-amount`] = [
        this.prescriptionMeds[i].doseInfo.amount,
        Validators.required
      ];
      controls[`med-${i}-dose-unit`] = [
        this.prescriptionMeds[i].doseInfo.unit,
        Validators.required
      ];
    }
    return this.fb.group(controls);
  }

  onDeletePrescriptionMed(index: number) {
    this.prescriptionMeds.splice(index, 1);
    this.episodeForm.removeControl("prescriptionMedGroup");
    this.episodeForm.addControl("prescriptionMedGroup", this.prescriptionMedGroup());
  }

  addPrescriptionMed() {
    this.prescriptionMeds.push({
      name: "",
      doseInfo: {
        amount: '',
        unit: ''
      }
    });
    this.episodeForm.removeControl("prescriptionMedGroup");
    this.episodeForm.addControl("prescriptionMedGroup", this.prescriptionMedGroup());
  }

  constructor(private dialogRef: MatDialogRef<EditEpisodeComponent>,
              private fb: UntypedFormBuilder,
              @Inject(MAT_DIALOG_DATA) [episode, patientId]: [Episode, string],
              private episodeService: EpisodeService,
              private medicationService: MedicationService,
              private dialog: MatDialog) {
    this.patientId = patientId;
    this.episode = episode;
  }

  ngOnInit(): void {
    if(this.episode.medications && this.episode.medications.prescriptionMeds) {
      this.prescriptionMeds = [].concat(this.episode.medications.prescriptionMeds)
        .sort((a,b) => (a.name<b.name)? -1: 1)
    }

    let triggerGroup = {
      food: false,
      light: false,
      anxiety: false,
      medication: false,
      stress: false,
      excitement: false,
      menstruation: false,
      temperature: false,
      water: false,
      additionalTriggers: ""
    }

    if (this.episode.knownTriggers && this.episode.knownTriggers[0]) {
      for(let trigger of this.episode.knownTriggers) {
        triggerGroup[trigger] = true;
      }
    }
    if(this.episode.otherTrigger) {
      triggerGroup["additionalTriggers"] = this.episode.otherTrigger;
    }

    this.episodeForm =this.fb.group({
      startTime: [this.episode.startTime.toDate(), Validators.required],
      endTime: [(this.episode.endTime)? this.episode.endTime.toDate() : null],
      symptomGroup: this.symptomGroup(this.episode),
      trigger: Boolean((this.episode.knownTriggers && this.episode.knownTriggers[0]) ||
        this.episode.otherTrigger),
      triggerGroup: this.fb.group(triggerGroup),
      rescueMedToggle: Boolean(this.episode.medications?.rescueMeds),
      rescueMedGroup: this.rescueMedGroup(this.episode),
      prescriptionMedGroup: this.prescriptionMedGroup(),
      behavior: this.episode.behavior? this.episode.behavior: ""
    });

    this.loadRescueMeds();
    this.loadArchivedRescueMeds();
  }

  loadRescueMeds() {
    this.loadingRescueMeds = true;
    this.medicationService.getMedicationsByType(this.patientId, true)
      .subscribe(
      medications => {
        this.rescueMedications = medications;
        this.episodeForm.removeControl("rescueMedGroup");
        this.episodeForm.addControl("rescueMedGroup", this.rescueMedGroup(this.episode));
        let medicationToggleInitiated: boolean =
          (typeof this.episodeForm.value.medicationToggle != 'undefined')
        let rescueMedicationPresent : boolean = medicationToggleInitiated?
          this.episodeForm.value.medicationToggle :
          Boolean(this.episode.medications?.rescueMeds);
          this.onMedToggleChange(rescueMedicationPresent);
        this.loadingRescueMeds = false;
      }
    )
  }

  loadArchivedRescueMeds() {
    if(this.episode.medications && Object.keys(this.episode.medications).length > 0)
    {
      let medications = this.episode.medications;
      if(medications.rescueMeds) {
        this.loadingArchivedMeds = true;
        this.medicationService.getMedicationsByIds(this.patientId,
          medications.rescueMeds.map((x)=> x.id),
          true)
          .subscribe({
            next: (archivedMeds)=> {
              this.archivedRescueMeds = this.archivedRescueMeds.concat(archivedMeds)
            },
            complete: () => {
              this.archivedRescueMeds.sort((a, b) => ((a.name < b.name)? -1 : 1));
              this.episodeForm.removeControl("rescueMedGroup");
              this.episodeForm.addControl("rescueMedGroup", this.rescueMedGroup(this.episode));
              let medicationToggleInitiated: boolean =
                (typeof this.episodeForm.value.medicationToggle != 'undefined')
              let rescueMedicationPresent : boolean = medicationToggleInitiated?
                this.episodeForm.value.medicationToggle :
                Boolean(this.episode.medications?.rescueMeds);
              this.onMedToggleChange(rescueMedicationPresent);
              this.loadingArchivedMeds = false;
            }
          })
      }
    }
  }

  onMedToggleChange(value: boolean) {
    if(!value) {
      this.episodeForm.get('rescueMedGroup').clearValidators();
      this.episodeForm.get('rescueMedGroup').updateValueAndValidity();
    }
    else {
      this.episodeForm.get('rescueMedGroup').setValidators(this.rescueMedsValidator());
      this.episodeForm.get('rescueMedGroup').updateValueAndValidity();
    }
  }

  createRescueMed() {
    const dialogConfig = new MatDialogConfig();

    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;
    dialogConfig.width = '350px';

    dialogConfig.data = {isRescue: true};

    this.dialog
      .open(CreateMedicationComponent, dialogConfig)
      .afterClosed()
      .subscribe((val) => {
        if (val) {
          this.loadRescueMeds()
        }
      });
  }

  close(): void {
    this.dialogRef.close()
  }

  save(): void {

    const val = this.episodeForm.value;
    let symptoms : Episode['symptoms']= {
      seizure: {},
      lossOfConsciousness:{},
      fullBody: {},
      eyes: {},
      leftArm: {},
      leftHand: {},
      leftLeg: {},
      rightArm: {},
      rightHand: {},
      rightLeg: {}
    }

    for (let index in this.symptomKeys) {
      let symptom = {}
      if(val.symptomGroup[this.symptomLabels[index]+' Checkbox']===true) {
        if (this.symptomKeys[index] != 'seizure' &&
            this.symptomKeys[index] != 'lossOfConsciousness') {
          symptom['type'] = val.symptomGroup[this.symptomLabels[index] + ' Dropdown'];
        } else {
          symptom['present'] = true;
        }
        if(val.symptomGroup[this.symptomLabels[index] + ' Time'])
          symptom['time'] = Timestamp.fromDate(val.symptomGroup[this.symptomLabels[index] + ' Time'])
        else
          symptom['time'] = Timestamp.fromDate(val.startTime);
      }
      symptoms[this.symptomKeys[index]] = symptom;
    }

    let triggers : [string] = ['']

    if (val.trigger === true) {
      let firstValue = true;
      for (let key in val.triggerGroup) {
        if (val.triggerGroup[key] === true) {
          if (firstValue)
          {
            triggers[0] = key;
            firstValue = false;
          }
          else
            triggers.push(key)
        }
      }
    }

    let rescueMeds = [];

    for (let i=0; i< this.prescriptionMeds.length; i++) {
      this.prescriptionMeds[i].name = val.prescriptionMedGroup[`med-${i}-name`];
      this.prescriptionMeds[i].doseInfo.amount = val.prescriptionMedGroup[`med-${i}-dose-amount`];
      this.prescriptionMeds[i].doseInfo.unit = val.prescriptionMedGroup[`med-${i}-dose-unit`];
    }

    if (val.rescueMedToggle === true) {
      for (let i=0; i < this.rescueMedications.length; i++) {
        if(val.rescueMedGroup['med-'+i+'-checkbox']===true) {
          let medication = this.rescueMedications[i];
          let time: Timestamp;
          if (val.rescueMedGroup['med-' + i + '-time'])
            time = Timestamp.fromDate(val.rescueMedGroup['med-' + i + '-time']);
          else
            time = Timestamp.fromDate(val.startTime);
          rescueMeds.push({
            id: medication.id,
            doseInfo: {
              amount: val.rescueMedGroup['med-' + i + '-dose-amount'],
              unit: val.rescueMedGroup['med-' + i + '-dose-unit']
            },
            time: time
          })
        }
      }
    }

    let medications = {}

    if (this.prescriptionMeds.length > 0)
      medications['prescriptionMeds'] = this.prescriptionMeds;
    if (rescueMeds.length > 0)
      medications['rescueMeds'] = rescueMeds;

    const updateEpisode: Partial<Episode> = {
      symptoms: symptoms,
      otherMedication: (val.medication)? val.medicationGroup.additionalMedication : "",
      otherTrigger: (val.trigger)?  val.triggerGroup.additionalTriggers : "",
      knownTriggers: triggers,
      medications: medications,
      behavior: val.behavior? val.behavior : ""
    };

    updateEpisode.startTime = Timestamp.fromDate(val.startTime);
    if(val.endTime)
      updateEpisode.endTime = Timestamp.fromDate(val.endTime);

    this.episodeService.updateEpisode(this.patientId, this.episode.id, updateEpisode)
      .subscribe(() => {
        this.dialogRef.close(updateEpisode);
    });
  }


}
