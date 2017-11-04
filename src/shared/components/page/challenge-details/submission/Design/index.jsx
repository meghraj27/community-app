/**
 * components.page.challenge-details.Design
 * <Design> Component
 *
 * Description:
 *   Page that is shown when a user is trying to submit a Design Submission.
 *   Allows user to upload Submission and Source Zip files plus an Image Preview
 *   via the Filestack V2 API.
 */
/* eslint-env browser */

import _ from 'lodash';
import config from 'utils/config';
import React from 'react';
import PT from 'prop-types';
import { PrimaryButton } from 'components/buttons';

import FilestackFilePicker from '../FilestackFilePicker';
import MultiInput, { checkValidationError } from './MultiInput';
import Uploading from '../Uploading';
import './styles.scss';

/* The maximum number of symbols allowed in the Notes textarea. */
const MAX_NOTES_LENGTH = 500;

/**
 * Submissions Page shown to design challengers.
 */
class Design extends React.Component {
  constructor(props) {
    super(props);

    this.handleSubmit = this.handleSubmit.bind(this);
    this.reset = this.reset.bind(this);
    this.retry = this.retry.bind(this);
    this.back = this.back.bind(this);
  }

  reset() {
    this.props.setAgreed(false);
    this.props.updateNotesLength(0);
    this.props.resetForm();
  }

  /* User has clicked to go retry the submission after an error */
  retry() {
    this.props.submitForm(this.formData);
  }

  /* User has clicked to go back to a new submission after a successful submit */
  back() {
    this.props.resetForm();
  }

  /* Check to see if either of the MultiInputs had validation errors */
  checkMultiInputError() {
    let error = false;
    this.props.multiInputs.forEach((multi) => {
      error = error || checkValidationError(multi.inputs);
    });
    return error;
  }

  /**
   * Call for Submit button.  Constructs a V3 API JSON object for the submission based
   * on form data and redux state.
   */
  handleSubmit(e) {
    e.preventDefault();

    const {
      userId,
      challengeId,
      phaseId,
      phaseType,
    } = this.props;

    const fonts = [];

    const fontSource = document.querySelectorAll('[data-type="fontSource"]');
    if (fontSource[0].value) { // Only add if it's not the default blank font input
      fontSource.forEach((source) => {
        fonts.push({ source: source.value });
      });

      const fontNames = document.querySelectorAll('[data-type="fontName"]');
      fontNames.forEach((name, index) => {
        fonts[index].name = name.value;
      });

      const fontUrls = document.querySelectorAll('[data-type="fontUrl"]');
      fontUrls.forEach((url, index) => {
        fonts[index].sourceUrl = url.value;
      });
    }

    const stockArts = [];

    /* TODO: This is awful code! Submission should be handled using the
     * proper ReactJS/Redux mechanics. Probably, we can keep it as it is
     * for some time, though, at it does work and we want to release it faster.
     */
    const photoNumber = document.querySelectorAll('[data-type="photoNumber"]');
    /* TODO: This if block prevents from sending stock art data if the first
     * input is left blank, but actually, it does not work correctly when
     * the first input is left blank while other are filled. */
    if (photoNumber[0].value) {
      photoNumber.forEach(({ value }) =>
        stockArts.push({
          fileNumber: value,
          sourceUrl: 'dummy.url',
        }));
    }

    const formData = new FormData(document.getElementById('submit-form'));

    const sub = this.props.submissionFilestackData;
    const source = this.props.sourceFilestackData;
    const preview = this.props.previewFilestackData;

    const body = {
      param: {
        reference: {
          id: challengeId.toString(), // Back-end expects this as string
          phaseId,
          phaseType: phaseType.toUpperCase(),
          type: 'CHALLENGE',
        },
        userId: parseInt(userId, 10),
        data: {
          method: 'DESIGN_CHALLENGE_FILE_PICKER_ZIP_FILE',
          files: [
            {
              name: sub.filename,
              type: 'SUBMISSION_ZIP',
              status: 'STAGED',
              stagedFileContainer: sub.container,
              stagedFilePath: sub.key,
              size: sub.size,
              mediaType: sub.mimetype,
            },
            {
              name: source.filename,
              type: 'SOURCE_ZIP',
              status: 'STAGED',
              stagedFileContainer: source.container,
              stagedFilePath: source.key,
              size: source.size,
              mediaType: source.mimetype,
            },
            {
              name: preview.filename,
              type: 'DESIGN_COVER',
              status: 'STAGED',
              stagedFileContainer: preview.container,
              stagedFilePath: preview.key,
              size: preview.size,
              mediaType: preview.mimetype,
            },
          ],
          submitterComments: formData.get('comment'),
          submitterRank: formData.get('rank') || 1,
          fonts,
          stockArts,
        },
      },
    };

    this.props.submitForm(JSON.stringify(body));
  }

  render() {
    const {
      challengeId,
      challengeName,
      challengesUrl,
      userId,
      isSubmitting,
      submitDone,
      errorMsg,
      track,
      uploadProgress,
      agreed,
      setAgreed,
      filePickers,
      setFilePickerError,
      setFilePickerFileName,
      setFilePickerDragged,
      notesLength,
      updateNotesLength,
      multiInputs,
      removeMultiInput,
      setMultiInputUrlValid,
      setMultiInputNameValid,
      setMultiInputSourceValid,
      setMultiInputActive,
      setSubmissionFilestackData,
      setSourceFilestackData,
      setPreviewFilestackData,
    } = this.props;

    // Find the state for the FilePickers
    const fpLookup = id => (filePickers.find(fp => fp.id === id) || ({
      id,
      error: '',
      fileName: '',
      dragged: false,
    }));

    // Find the state for the MultiInputs
    const multiLookup = id => (multiInputs.find(fp => fp.id === id) || ({
      id,
    }));

    const fpSubmission = fpLookup('file-picker-submission');
    const fpSource = fpLookup('file-picker-source');
    const fpPreview = fpLookup('file-picker-preview');

    const multiFonts = multiLookup('multi-input-fonts');
    const multiStockArt = multiLookup('multi-input-stock-art');

    return (!isSubmitting && !submitDone && !errorMsg) ? (
      <div styleName="design-content">
        <form
          method="POST"
          name="submitForm"
          encType="multipart/form-data"
          id="submit-form"
          onSubmit={this.handleSubmit}
        >
          <div styleName="row">
            <div styleName="left">
              <h4>FILES</h4>
              <p>
                Please follow the instructions on the Challenge Details page
                regarding what your submission, source and preview files should
                contain.
              </p>
              <p>
                Do not name any of your files &quot;declaration.txt&quot;
                as this is added by our system.
              </p>
              <p>
                Please be sure to double-check that you have submitted the
                correct files and that your JPG files (if applicable) are in
                RGB color mode.
              </p>
              <p>
                <a
                  href={config.URL.INFO.DESIGN_CHALLENGE_SUBMISSION}
                  rel="noreferrer noopener"
                  target="_blank"
                >Learn more about formatting your submission file.</a>
              </p>
            </div>
            <div styleName="right">
              <div styleName="file-picker-container">
                <FilestackFilePicker
                  mandatory
                  title="SUBMISSION"
                  fileExtensions={['.zip']}
                  id="file-picker-submission"
                  error={fpSubmission.error}
                  // Bind the set functions to the FilePicker's ID
                  setError={_.partial(setFilePickerError, 'file-picker-submission')}
                  fileName={fpSubmission.fileName}
                  setFileName={_.partial(setFilePickerFileName, 'file-picker-submission')}
                  dragged={fpSubmission.dragged}
                  setDragged={_.partial(setFilePickerDragged, 'file-picker-submission')}
                  setFilestackData={setSubmissionFilestackData}
                  userId={userId}
                />
                <FilestackFilePicker
                  mandatory
                  title="SOURCE"
                  fileExtensions={['.zip']}
                  id="file-picker-source"
                  error={fpSource.error}
                  setError={_.partial(setFilePickerError, 'file-picker-source')}
                  fileName={fpSource.fileName}
                  setFileName={_.partial(setFilePickerFileName, 'file-picker-source')}
                  dragged={fpSource.dragged}
                  setDragged={_.partial(setFilePickerDragged, 'file-picker-source')}
                  setFilestackData={setSourceFilestackData}
                  userId={userId}
                />
                <FilestackFilePicker
                  mandatory
                  title="PREVIEW"
                  fileExtensions={['.jpg', '.png']}
                  id="file-picker-preview"
                  error={fpPreview.error}
                  setError={_.partial(setFilePickerError, 'file-picker-preview')}
                  fileName={fpPreview.fileName}
                  setFileName={_.partial(setFilePickerFileName, 'file-picker-preview')}
                  dragged={fpPreview.dragged}
                  setDragged={_.partial(setFilePickerDragged, 'file-picker-preview')}
                  setFilestackData={setPreviewFilestackData}
                  userId={userId}
                />
              </div>
              <span styleName="desc">
                SUBMISSION#
              </span>
              <input styleName="submission-desc" placeholder="1" name="rank" />
            </div>
          </div>
          <div styleName="row">
            <div styleName="left">
              <h4>NOTES</h4>
              <p>Type a short note about your design here. Explain revisions or
                other design elements that may not be clear.
              </p>
            </div>
            <div styleName="right">
              <div styleName="desc-container">
                <span styleName="desc">
                  COMMENTS
                </span>
                <span>
                  { notesLength } / { MAX_NOTES_LENGTH }
                </span>
              </div>
              <textarea
                onChange={(event) => {
                  const target = event.target;
                  if (target.value.length > MAX_NOTES_LENGTH) {
                    target.value = target.value.slice(0, MAX_NOTES_LENGTH);
                  }
                  updateNotesLength(target.value.length);
                }}
                styleName="big-input"
                placeholder="Example: My design tries to solve the problem with a particular idea in mind. The use of color is based on the provided brand guideline. The flows are included in the sub folder. I followed all revisions as per the directions provided."
                name="comment"
              />
            </div>
          </div>
          <div styleName="row">
            <div styleName="left">
              <h4>DID YOU USE CUSTOM FONTS?</h4>
              <p>
                Check to see if your font is on the Studio Standard Fonts list.
                If it is, leave the URL field
              </p>
              <p>
                Read the
                &zwnj;<a
                  href={config.URL.INFO.STUDIO_FONTS_POLICY}
                  rel="norefferer noopener"
                  target="_blank"
                >Studio Fonts Policy</a>
              </p>
              <p>
                If your fonts is not on the list, you must provide the URL
                to the font page (not file) from one of the approved
                font websites in the dropdown box.
              </p>
            </div>
            <div styleName="right">
              <MultiInput
                buttonName="+ Add Font"
                type="ADDFONT"
                id="multi-input-stock-art"
                inputs={multiFonts.inputs}
                removeInput={_.partial(removeMultiInput, 'multi-input-fonts')}
                setInputUrlValid={_.partial(setMultiInputUrlValid, 'multi-input-fonts')}
                setInputNameValid={_.partial(setMultiInputNameValid, 'multi-input-fonts')}
                setInputSourceValid={_.partial(setMultiInputSourceValid, 'multi-input-fonts')}
                setInputActive={_.partial(setMultiInputActive, 'multi-input-fonts')}
              />
            </div>
          </div>
          <div styleName="row">
            <div styleName="left">
              <h4>DID YOU USE STOCK ART?</h4>
              <p>
                If you used any stock photos in your design mocks, please
                provide the location and details so that the client can obtain
                them. Follow the guidelines at our
                &zwnj;<a
                  href={config.URL.INFO.STOCK_ART_POLICY}
                  rel="norefferer noopener"
                  target="_blank"
                >Studio Stock Art Policy</a>.
              </p>
            </div>
            <div styleName="right">
              <MultiInput
                type="ADDSTOCK"
                buttonName="+ Add Stock"
                id="multi-input-fonts"
                inputs={multiStockArt.inputs}
                removeInput={_.partial(removeMultiInput, 'multi-input-stock-art')}
                setInputUrlValid={_.partial(setMultiInputUrlValid, 'multi-input-stock-art')}
                setInputNameValid={_.partial(setMultiInputNameValid, 'multi-input-stock-art')}
                setInputSourceValid={_.partial(setMultiInputSourceValid, 'multi-input-stock-art')}
                setInputActive={_.partial(setMultiInputActive, 'multi-input-stock-art')}
              />
            </div>
          </div>
          <div styleName="row agree">
            <p>
              Submitting your files means you hereby agree to the
              &zwnj;<a
                href={config.URL.INFO.TOPCODER_TERMS}
                rel="norefferer noopener"
                target="_blank"
              >Topcoder terms of use</a>&zwnj;
              and to the extent your uploaded file wins a topcoder Competition,
              you hereby assign, grant and transfer and agree to assign, grant and
              transfer to topcoder all right and challengeName in and to the Winning Submission
              (as further described in the terms of use).
            </p>
            <div styleName="tc-checkbox">
              <input
                type="checkbox"
                id="agree"
                onChange={e => setAgreed(e.target.checked)}
              />
              <label htmlFor="agree">
                <div styleName="tc-checkbox-label">I UNDERSTAND AND AGREE</div>
              </label>
            </div>
            <PrimaryButton
              disabled={
                !agreed ||
                !!fpPreview.error || !fpPreview.fileName ||
                !!fpSource.error || !fpSource.fileName ||
                !!fpSubmission.error || !fpSubmission.fileName ||
                this.checkMultiInputError()
              }
            >Submit</PrimaryButton>
          </div>
        </form>
      </div>
    ) :
      <Uploading
        challengeId={challengeId}
        challengeName={challengeName}
        challengesUrl={challengesUrl}
        isSubmitting={isSubmitting}
        submitDone={submitDone}
        reset={this.reset}
        track={track}
        error={errorMsg}
        retry={this.retry}
        back={this.back}
        uploadProgress={uploadProgress}
      />;
  }
}

/* Reusable prop validation for Filestack data objects */
const filestackDataProp = PT.shape({
  filename: PT.string.isRequired,
  mimetype: PT.string.isRequired,
  size: PT.number.isRequired,
  key: PT.string.isRequired,
  container: PT.string.isRequired,
});

/**
 * Prop Validation
 */
Design.propTypes = {
  userId: PT.string.isRequired,
  challengeId: PT.number.isRequired,
  challengeName: PT.string.isRequired,
  challengesUrl: PT.string.isRequired,
  phaseId: PT.number.isRequired,
  phaseType: PT.string.isRequired,
  isSubmitting: PT.bool.isRequired,
  submitDone: PT.bool.isRequired,
  errorMsg: PT.string.isRequired,
  submitForm: PT.func.isRequired,
  resetForm: PT.func.isRequired,
  track: PT.string.isRequired,
  uploadProgress: PT.number.isRequired,
  setAgreed: PT.func.isRequired,
  agreed: PT.bool.isRequired,
  filePickers: PT.arrayOf(PT.shape({
    id: PT.string.isRequired,
    error: PT.string.isRequired,
    fileName: PT.string.isRequired,
  }).isRequired).isRequired,
  setFilePickerError: PT.func.isRequired,
  setFilePickerFileName: PT.func.isRequired,
  setFilePickerDragged: PT.func.isRequired,
  notesLength: PT.number.isRequired,
  updateNotesLength: PT.func.isRequired,
  multiInputs: PT.arrayOf(PT.shape({
    id: PT.string.isRequired,
    inputs: PT.arrayOf(PT.shape({
      urlValid: PT.bool,
      nameValid: PT.bool,
      sourceValid: PT.bool.isRequired,
      active: PT.bool.isRequired,
    }).isRequired).isRequired,
  }).isRequired).isRequired,
  removeMultiInput: PT.func.isRequired,
  setMultiInputUrlValid: PT.func.isRequired,
  setMultiInputNameValid: PT.func.isRequired,
  setMultiInputSourceValid: PT.func.isRequired,
  setMultiInputActive: PT.func.isRequired,
  setSubmissionFilestackData: PT.func.isRequired,
  setSourceFilestackData: PT.func.isRequired,
  setPreviewFilestackData: PT.func.isRequired,
  submissionFilestackData: filestackDataProp.isRequired,
  sourceFilestackData: filestackDataProp.isRequired,
  previewFilestackData: filestackDataProp.isRequired,
};

export default Design;