export const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
};

const DEFAULT_ERROR = "Something went wrong.";

type SetErrorMessageHandler = (error: string | null) => void;
type SetLoadingHandler = (isLoading: boolean) => void;

export class FetchHelper {
  private setErrorMessage: SetErrorMessageHandler;
  private setLoading: SetLoadingHandler;

  constructor(
    setErrorMessage: SetErrorMessageHandler,
    setLoading?: SetLoadingHandler,
  ) {
    this.setErrorMessage = setErrorMessage;
    this.setLoading = setLoading ?? function (_isLoading: boolean) {};
  }

  static withAlert(errorMessagePrefix: string) {
    const onError = (errorMessage: string | null) => {
      if (errorMessage !== null) {
        alert(`${errorMessagePrefix}\n${errorMessage}`);
      }
    };
    return new FetchHelper(onError);
  }

  /* desired behavior for error handling:
    - normally server returns json { error: string }, if that's the case, use
      the provided error message
    - if it's parse-able json, but does not have error string, return response
      status only
    - if it's not json (unsatisfied server guards, etc.), return response status */
  async getErrorMessage(response: Response) {
    try {
      const json = await response.json();
      if (Object.hasOwn(json, "error")) {
        return json.error ?? DEFAULT_ERROR;
      }
    } catch (_error) {
      // ignore the json parsing error
    }

    return `${response.status}`;
  }

  /* This helper provides uniform handling of fetch responses for callsites with
    explicit error handling logic (e.g. display error notification) and loading 
    indicator (e.g. loading banner). "Fire&forget" style fetch calls don't need
    to use this.

    onSuccess and onError callbacks have to be called before loading state
    and error message are updated. Because of that, I cannot use usual .then
     approach.

    Promise returned from this function will always be successful. It does not
    indicate whether onSuccess or onFailure were called, it just indicates completion.

    I have to leave function async, because occasionally I need to get clear signal
    when the whole process had finished all it's state updates. For example:
      - function to refresh data is implemented using helper in App root
      - it is passed as "refreshData" to downstream components
      - some components will perform writes, upon which data needs to be refetched
      - on interaction, and before write is performed, the component will set its
        state to loading to render loading indicator in appropriate context
      - after write completes, it will await refreshData, and only when all promises
        have returned it will disable loading indicator
  */
  async fetch<T>(
    request: Request,
    onSuccess: (result: T) => void,
    onError?: () => void,
  ) {
    try {
      this.setLoading(true);
      const response = await fetch(request);

      if (!response.ok) {
        let errorMessage = await this.getErrorMessage(response);
        throw new Error(errorMessage);
      }

      const json = (await response.json()) as T;
      await onSuccess(json);

      // if callback didn't throw, reset loading state and clear all previous errors;
      this.setLoading(false);
      this.setErrorMessage(null);
    } catch (error) {
      if (onError !== undefined) {
        try {
          await onError();
        } catch (error) {
          alert(`FATAL: FetchHelper onError handler threw: ${error}`);
          throw error;
        }
      }

      const errorMessage =
        error instanceof Error ? error.message : DEFAULT_ERROR;
      this.setLoading(false);
      this.setErrorMessage(errorMessage);
    }
  }
}
