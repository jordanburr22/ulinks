/* eslint-disable eqeqeq */
/* eslint-disable no-param-reassign */
/* eslint-disable no-underscore-dangle */
/* eslint-disable react/jsx-boolean-value */
import {
  Button,
  FormControl,
  FormLabel,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
  Textarea,
  useToast,
} from "@chakra-ui/react";
import { FieldArray, Form, withFormik } from "formik";
import React, { useState } from "react";
import { useIntl } from "react-intl";

import client from "../apollo-client";
import { departments } from "../constants";
import { messages } from "../constants/intl/components/CreateChatModal";
import { ChatSchema } from "../constants/YupSchemas";
import { UPDATE_GROUPCHAT } from "../gql/GroupChat";
import CourseInfo from "./CourseInfo";
import LinkFields from "./LinkFields";

const ChatForm = ({
  errors,
  setFieldValue,
  values: { name, description, links, courseInfo, isCommunity },
}) => {
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const isValid = name || description || links || isCommunity;
  const { formatMessage } = useIntl();
  return (
    <Form className="col-6 w-100">
      <FormControl id="name" isInvalid={hasSubmitted && errors.name}>
        <FormLabel>{formatMessage(messages.name)}</FormLabel>
        <Input
          value={name}
          type="text"
          onChange={(e) => {
            setFieldValue("name", e.target.value);
            if (
              e.target.value.length === 6 &&
              departments.includes(e.target.value.slice(0, 3).toUpperCase()) &&
              parseInt(e.target.value.slice(3), 10) >= 100 &&
              parseInt(e.target.value.slice(3), 10) <= 499
            ) {
              setFieldValue(
                "courseInfo.department",
                name.slice(0, 3).toUpperCase()
              );
              setFieldValue("courseInfo.code", e.target.value.slice(3));
            }
          }}
        />
        {hasSubmitted && <Text color="red">{errors.name}</Text>}
      </FormControl>
      <FormControl
        id="description"
        mt={2}
        isInvalid={hasSubmitted && errors.description}
      >
        <FormLabel>{formatMessage(messages.description)}</FormLabel>
        <Textarea
          value={description}
          onChange={(e) => setFieldValue("description", e.target.value)}
        />
        {hasSubmitted && <Text color="red">{errors.description}</Text>}
      </FormControl>
      {!isCommunity && (
        <CourseInfo
          errors={errors}
          setFieldValue={setFieldValue}
          hasSubmitted={hasSubmitted}
          values={courseInfo}
          prependCourseInfo
        />
      )}
      <FieldArray
        name="links"
        render={() => (
          <LinkFields
            errors={errors}
            hasSubmitted={hasSubmitted}
            links={links}
            setFieldValue={setFieldValue}
          />
        )}
      />
      <Button
        className="w-100 mt-4"
        isDisabled={!isValid}
        colorScheme="green"
        type="submit"
        onClick={() => setHasSubmitted(true)}
      >
        {formatMessage(messages.submit)}
      </Button>
    </Form>
  );
};

const EnhancedChatForm = withFormik({
  enableReinitialize: true,
  handleSubmit: async (
    {
      // eslint-disable-next-line prettier/prettier
      name,
      description,
      status,
      links,
      isCommunity,
      courseInfo,
      id,
    },
    { props: { onClose, setChatInfo, toast } }
  ) => {
    if (courseInfo.__typename != undefined) {
      delete courseInfo.__typename;
    }
    const {
      data: {
        groupChat: {
          id: groupChatId,
          name: groupChatName,
          description: groupChatDesc,
          links: groupChatLinks,
          isCommunity: groupChatIsCommunity,
          image: groupChatImage,
          status: groupChatStatus,
          courseInformation: groupChatCourseInfo,
          created,
          updated,
        },
      },
    } = await client.mutate({
      mutation: UPDATE_GROUPCHAT,
      variables: {
        id,
        chatInfo: {
          name,
          status,
          description,
          isCommunity,
          links,
          ...(!isCommunity ? { courseInformation: courseInfo } : {}),
        },
      },
    });
    toast({
      title: "Success",
      description: `${groupChatName} info has been changed`,
      status: "success",
      position: "bottom-left",
      duration: 5000,
      isCloseable: false,
    });
    setChatInfo({
      id: groupChatId,
      name: groupChatName,
      description: groupChatDesc,
      links: groupChatLinks,
      isCommunity: groupChatIsCommunity,
      image: groupChatImage,
      status: groupChatStatus,
      courseInformation: groupChatCourseInfo,
      created,
      updated,
    });
    onClose();
  },
  mapPropsToValues: ({ initialVals, id }) => ({
    id,
    name: initialVals.name,
    description: initialVals.description,
    links: initialVals.links,
    status: initialVals.status,
    isCommunity: initialVals.isCommunity,
    courseInfo: !initialVals.isCommunity ? initialVals.courseInformation : {},
  }),
  validationSchema: () => ChatSchema,
  validateOnBlur: true,
  validateOnChange: true,
  validateOnMount: true,
})(ChatForm);

export default function EditChatModal({
  isOpen,
  onClose,
  initialVals,
  id,
  setChatInfo,
}) {
  const toast = useToast();
  return (
    <Modal size="xl" isOpen={isOpen} onClose={onClose} preserveScrollBarGap>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Edit Group Chat</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <EnhancedChatForm
            onClose={onClose}
            toast={toast}
            initialVals={initialVals}
            id={id}
            setChatInfo={setChatInfo}
          />
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
