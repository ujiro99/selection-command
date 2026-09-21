import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { FormProvider, useForm, useWatch } from "react-hook-form"
import { describe, expect, it } from "vitest"
import {
  MAX_VARIABLE_NAME_LENGTH,
  UserVariablesField,
} from "./UserVariablesField"

type FormValues = {
  userVariables: Array<{ name: string; value: string }>
}

const FormState = () => {
  const userVariables = useWatch<FormValues>({ name: "userVariables" })
  return (
    <output data-testid="form-state">{JSON.stringify(userVariables)}</output>
  )
}

const Wrapper = ({
  suggested = true,
  defaultVariables = [],
  referencingTemplates,
}: {
  suggested?: boolean
  defaultVariables?: FormValues["userVariables"]
  referencingTemplates?: Array<string>
}) => {
  // Match the intentionally untyped form contract exposed by the component.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const methods = useForm<any>({
    defaultValues: { userVariables: defaultVariables },
  })

  return (
    <FormProvider {...methods}>
      <UserVariablesField
        control={methods.control}
        name="userVariables"
        formLabel="User variables"
        referencingTemplates={referencingTemplates}
        suggestion={
          suggested ? { name: "Prompt", recommendedBy: "ChatGPT" } : undefined
        }
      />
      <FormState />
    </FormProvider>
  )
}

describe("UserVariablesField suggestions", () => {
  it("UV-01: does not show a suggestion when none is provided", () => {
    render(<Wrapper suggested={false} />)

    expect(screen.queryByRole("button", { name: "Prompt" })).toBeNull()
    expect(screen.queryByText("Option_userVariable_recommended")).toBeNull()
  })

  it("UV-02: shows a recommendation without automatically creating a variable", () => {
    render(<Wrapper />)

    const suggestionButton = screen.getByRole("button", { name: "Prompt" })
    const recommendation = screen.getByText("Option_userVariable_recommended")
    expect(suggestionButton.parentElement).toContainElement(recommendation)
    expect(screen.getByTestId("form-state")).toHaveTextContent("[]")
  })

  it("UV-03: creates the suggested variable only after it is saved", async () => {
    const user = userEvent.setup()
    render(<Wrapper />)

    await user.click(screen.getByRole("button", { name: "Prompt" }))
    await user.click(screen.getByRole("button", { name: "Option_labelSave" }))

    expect(screen.getByTestId("form-state")).toHaveTextContent(
      '[{"name":"Prompt","value":""}]',
    )
  })

  it("UV-04: limits variable names to 20 characters and shows the remaining count", async () => {
    const user = userEvent.setup()
    render(<Wrapper />)

    await user.click(screen.getByRole("button", { name: "Prompt" }))
    expect(screen.getByRole("dialog")).toBeInTheDocument()
    expect(
      screen.getByText("Option_userVariable_dialog_desc"),
    ).toBeInTheDocument()
    expect(
      screen.getByText("Option_userVariable_name_desc"),
    ).toBeInTheDocument()
    expect(
      screen.getByText("Option_userVariable_value_label"),
    ).toBeInTheDocument()
    expect(screen.queryByText("Option_userVariables_desc")).toBeNull()
    const input = screen.getByLabelText("Option_userVariable_name")
    expect(
      screen.getByLabelText("Option_userVariable_value_label"),
    ).toBeInTheDocument()

    expect(input).toHaveAttribute("maxLength", `${MAX_VARIABLE_NAME_LENGTH}`)
    await user.clear(input)
    expect(
      screen.getByText("Option_userVariable_name_remaining: 20"),
    ).toBeInTheDocument()

    await user.type(input, "abcdefghijklmnopqrstu")

    expect(input).toHaveValue("abcdefghijklmnopqrst")
    expect(
      screen.getByText("Option_userVariable_name_remaining: 0"),
    ).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Option_labelSave" }))
    expect(screen.getByTestId("form-state")).toHaveTextContent(
      '[{"name":"abcdefghijklmnopqrst","value":""}]',
    )

    await user.click(
      screen.getByRole("button", { name: "{{abcdefghijklmnopqrst}}" }),
    )
    expect(screen.getByRole("dialog")).toBeInTheDocument()
  })

  it("UV-05: discards a new variable when the dialog is cancelled", async () => {
    const user = userEvent.setup()
    render(<Wrapper />)

    await user.click(screen.getByRole("button", { name: "Prompt" }))
    await user.click(screen.getByRole("button", { name: "Option_labelCancel" }))

    expect(screen.getByTestId("form-state")).toHaveTextContent("[]")
    expect(screen.queryByRole("button", { name: "{{Prompt}}" })).toBeNull()
  })

  it("UV-06: discards a new variable when the dialog is dismissed", async () => {
    const user = userEvent.setup()
    render(<Wrapper />)

    await user.click(
      screen.getByRole("button", { name: "Option_userVariable_add" }),
    )
    await user.keyboard("{Escape}")

    expect(screen.getByTestId("form-state")).toHaveTextContent("[]")
  })

  it("UV-07: discards changes to an existing variable when cancelled", async () => {
    const user = userEvent.setup()
    render(
      <Wrapper
        suggested={false}
        defaultVariables={[{ name: "Existing", value: "Original" }]}
      />,
    )

    await user.click(screen.getByRole("button", { name: "{{Existing}}" }))
    const nameInput = screen.getByPlaceholderText("Option_userVariable_name")
    const valueInput = screen.getByPlaceholderText("Option_userVariable_value")
    await user.clear(nameInput)
    await user.type(nameInput, "Changed")
    await user.clear(valueInput)
    await user.type(valueInput, "Updated")
    await user.click(screen.getByRole("button", { name: "Option_labelCancel" }))

    expect(screen.getByTestId("form-state")).toHaveTextContent(
      '[{"name":"Existing","value":"Original"}]',
    )
  })

  it("UV-08: shows validation errors only after the user starts editing", async () => {
    const user = userEvent.setup()
    render(<Wrapper suggested={false} />)

    await user.click(
      screen.getByRole("button", { name: "Option_userVariable_add" }),
    )
    expect(screen.queryByText("Option_userVariable_name_required")).toBeNull()

    await user.type(
      screen.getByLabelText("Option_userVariable_value_label"),
      "Some value",
    )

    expect(
      screen.getByText("Option_userVariable_name_required"),
    ).toBeInTheDocument()
  })
})

describe("UserVariablesField references", () => {
  it("UV-09: removes an unreferenced variable without confirming", async () => {
    const user = userEvent.setup()
    render(
      <Wrapper
        suggested={false}
        defaultVariables={[{ name: "Unused", value: "" }]}
        referencingTemplates={["plain step value"]}
      />,
    )

    await user.click(
      screen.getByRole("button", { name: "Option_userVariable_remove" }),
    )

    expect(screen.queryByText("Option_remove_title")).toBeNull()
    expect(screen.getByTestId("form-state")).toHaveTextContent("[]")
  })

  it("UV-10: confirms before removing a variable a step still references", async () => {
    const user = userEvent.setup()
    render(
      <Wrapper
        suggested={false}
        defaultVariables={[{ name: "Prompt", value: "" }]}
        referencingTemplates={["Summarize {{Prompt}}"]}
      />,
    )

    await user.click(
      screen.getByRole("button", { name: "Option_userVariable_remove" }),
    )

    expect(
      screen.getByText("Option_userVariable_remove_inUse"),
    ).toBeInTheDocument()
    expect(screen.getByTestId("form-state")).toHaveTextContent(
      '[{"name":"Prompt","value":""}]',
    )

    await user.click(screen.getByRole("button", { name: "Option_remove_ok" }))

    expect(screen.getByTestId("form-state")).toHaveTextContent("[]")
  })

  it("UV-11: confirms before removing a variable another variable references", async () => {
    const user = userEvent.setup()
    render(
      <Wrapper
        suggested={false}
        defaultVariables={[
          { name: "Base", value: "hello" },
          { name: "Derived", value: "{{Base}} world" },
        ]}
      />,
    )

    await user.click(
      screen.getAllByRole("button", { name: "Option_userVariable_remove" })[0],
    )

    expect(
      screen.getByText("Option_userVariable_remove_inUse"),
    ).toBeInTheDocument()
  })

  it("UV-12: warns when renaming a referenced variable", async () => {
    const user = userEvent.setup()
    render(
      <Wrapper
        suggested={false}
        defaultVariables={[{ name: "Prompt", value: "" }]}
        referencingTemplates={["Summarize {{Prompt}}"]}
      />,
    )

    await user.click(screen.getByRole("button", { name: "{{Prompt}}" }))
    expect(screen.queryByText("Option_userVariable_rename_inUse")).toBeNull()

    const nameInput = screen.getByPlaceholderText("Option_userVariable_name")
    await user.clear(nameInput)
    await user.type(nameInput, "Question")

    expect(
      screen.getByText("Option_userVariable_rename_inUse"),
    ).toBeInTheDocument()
  })
})
