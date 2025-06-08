import { useAuth } from "@/contexts/AuthContext";
import { useToastController } from "@tamagui/toast";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { H5, Text, XStack, YStack } from "tamagui";
import { CardWrapper } from "../common";
import { getUserInterests, updateUser } from "@/common/api/user.action";
import { pick, startCase } from "@/utils";
import { IAddress, ITag } from "@/definitions/types";
import { Pencil, Plus, X } from "@tamagui/lucide-icons";
import { FilledButton, OutlineButton } from "@/components/ui/Buttons";
import { Check } from "@tamagui/lucide-icons";
import { InputGroup } from "@/components/Form";
import GenderSelection from "@/screens/OnBoarding/GenderSelection";
import LocationInput from "@/components/LocationInput";
import { isEmpty } from "@/utils";
import UsernameInput from "@/components/UsernameInput";
import React from "react";
import { useDataLoader } from "@/hooks";
import Loader from "@/components/ui/Loader";
import CustomTooltip from "@/components/CustomTooltip";
import { useDialog } from "@/hooks/useModal";
import InterestSelection from "@/screens/OnBoarding/InterestSelection";
import { TagPreviewTooltip } from "@/components/ui/common-components";

type IFormData = {
  fullName: string;
  email: string;
  gender: string;
  address?: IAddress;
  username?: string;
  _location?: string;
};

const InterestBadge = ({ name }: { name: string }) => {
  return (
    <Text
      fontSize={"$3"}
      px={"$2"}
      py={"$1"}
      rounded={"$2"}
      bg={"$color10"}
      color={"$color12"}
      cursor={"pointer"}
    >
      {name}
    </Text>
  );
};

const InterestsDialog = ({
  closeModal,
  preSelectedTags,
  setPreSelectedTags
}: {
  closeModal: () => void;
  preSelectedTags: ITag[];
  setPreSelectedTags: (tags: ITag[]) => void;
}) => {
  const { user } = useAuth();
  const toastController = useToastController();
  const selectedInterestsRef = useRef<ITag[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const handleUpdateInterests = async () => {
    if (isEmpty(selectedInterestsRef.current)) {
      closeModal();
      return;
    }

    setIsSaving(true);

    try {
      // filter into deleted and added tags
      const deletedTags = preSelectedTags?.filter((tag: ITag) => !selectedInterestsRef.current.includes(tag));
      const addedTags = selectedInterestsRef.current?.filter((tag: ITag) => !preSelectedTags?.includes(tag));

      // update user with deleted and added tags
      const payload = {
        deleted: deletedTags?.map((tag: ITag) => tag.id),
        added: addedTags?.map((tag: ITag) => tag.id)
      };
      await updateUser(user?.id || "", { interests: payload });
      closeModal();
      toastController.show("Interests updated successfully");
      setPreSelectedTags(selectedInterestsRef.current);
    } catch (error: any) {
      toastController.show(error?.message || "Something went wrong");
    } finally {
      setIsSaving(false);
    }
  };
  return (
    <>
      <H5>Add Interest</H5>
      <InterestSelection
        cb={(tags) => {
          selectedInterestsRef.current = tags;
        }}
        maxH={400}
        preSelectedInterests={preSelectedTags || []}
      />
      <XStack
        justify={"flex-end"}
        gap={"$2"}
      >
        <OutlineButton
          width={"auto"}
          disabled={isSaving}
          size={"medium"}
          onPress={() => {
            closeModal();
            selectedInterestsRef.current = [];
          }}
        >
          Cancel
        </OutlineButton>
        <FilledButton
          size={"medium"}
          width={"auto"}
          onPress={handleUpdateInterests}
          disabled={isSaving}
          iconAfter={isSaving ? <Loader /> : undefined}
        >
          Update
        </FilledButton>
      </XStack>
    </>
  );
};

const Interests = () => {
  const { user } = useAuth();
  const toastController = useToastController();
  const { close, open, RenderContent } = useDialog();

  const { data, loading, setData } = useDataLoader(asyncGetUserInterests);

  async function asyncGetUserInterests() {
    try {
      const { data, error } = await getUserInterests(user?.id || "");
      if (error) throw error;
      return data;
    } catch (error: any) {
      toastController.show(error?.error?.message || "Something went wrong");
    }
  }

  return (
    <>
      <CardWrapper>
        <XStack
          justify={"space-between"}
          items={"center"}
          gap={"$4"}
        >
          <H5>Interests</H5>
          {data?.length && (
            <Plus
              size={"$1"}
              cursor="pointer"
              onPress={open}
            />
          )}
        </XStack>
        {loading ? (
          <Loader />
        ) : (
          <XStack
            flexWrap="wrap"
            gap={"$2"}
          >
            {data?.map((interest: ITag) => (
              <CustomTooltip
                trigger={<InterestBadge name={interest.name} />}
                key={interest.id}
                tooltipConfig={{ placement: "top", delay: 0 }}
              >
                <TagPreviewTooltip tag={interest} />
              </CustomTooltip>
            ))}
          </XStack>
        )}
      </CardWrapper>

      <RenderContent>
        <InterestsDialog
          closeModal={close}
          preSelectedTags={data}
          setPreSelectedTags={setData}
        />
      </RenderContent>
    </>
  );
};

const InfoTabContent = () => {
  const { user, updateUser: updateContextUser } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const toastController = useToastController();

  const {
    control,
    setValue,
    setError,
    formState: { errors, isDirty },
    handleSubmit,
    reset
  } = useForm<IFormData>({
    defaultValues: {
      username: user?.username,
      address: user?.address || {},
      gender: user?.gender,
      _location: user?.address?.address || "",
      fullName: user?.name
    }
  });

  const viewInputs = pick(user, ["name", "email", "gender", "address.address", "username"]);

  const handleSave = async (data: IFormData) => {
    setIsSaving(true);
    try {
      const { fullName, gender, address, username, _location } = data;
      const payload = {
        name: fullName,
        gender,
        address: { ...(address || {}), address: _location },
        username
      };
      const res = await updateUser(user?.id || "", payload);
      if (!res.error) {
        setIsEditing(false);
        reset({ ...payload, _location: payload.address?.address }, { keepDirty: false });
        updateContextUser(payload);
        toastController.show("Profile updated successfully");
      } else {
        throw new Error(res.error);
      }
    } catch (error: any) {
      toastController.show(error?.error || "Something went wrong");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePress = () => {
    if (isEditing) {
      handleSubmit(handleSave)();
    } else {
      setIsEditing((prev) => !prev);
    }
  };

  const isButtonDisabled = (!isDirty && isEditing && !Object.keys(errors).length) || isSaving;

  return (
    <YStack gap={"$4"}>
      <CardWrapper>
        <XStack
          gap={"$3"}
          items={"center"}
          justify={"space-between"}
        >
          <H5>Basic Info</H5>

          <XStack
            gap={"$3"}
            items={"center"}
            justify={"space-between"}
          >
            <OutlineButton
              size={"small"}
              icon={isEditing ? <Check /> : <Pencil />}
              onPress={handlePress}
              disabled={isButtonDisabled}
            >
              {isEditing ? "Save" : "Edit"}
            </OutlineButton>

            {isEditing && (
              <OutlineButton
                size={"small"}
                icon={<X />}
                onPress={() => setIsEditing(false)}
                danger={true}
              >
                Cancel
              </OutlineButton>
            )}
          </XStack>
        </XStack>

        <YStack gap={"$3"}>
          {isEditing ? (
            <>
              <InputGroup
                control={control}
                rules={{}}
                error={errors.fullName?.message}
                placeHolder="Name"
                name="fullName"
                label="Full Name"
              />
              {user?.gender && (
                <GenderSelection
                  disabled={!isEditing}
                  cb={(value) => {
                    setValue("gender", value, { shouldDirty: true });
                  }}
                  preSelectedGender={user?.gender}
                />
              )}
              {!isEmpty(user?.address) && (
                <LocationInput
                  existingLocation={{
                    ...(user?.address || {}),
                    _location: user?.address?.address || ""
                  }}
                  setValue={(value) => {
                    const { _location, ...rest } = value;
                    setValue(
                      "address",
                      {
                        ...rest
                      },
                      { shouldDirty: true }
                    );
                    setValue("_location", _location || "", { shouldDirty: true });
                  }}
                  control={control}
                  errors={{}}
                  isViewOnly={!isEditing}
                />
              )}

              {user?.username && (
                <UsernameInput
                  control={control}
                  currentValue={user?.username}
                  error={errors.username?.message}
                  setError={setError}
                  isViewOnly={!isEditing}
                />
              )}
            </>
          ) : (
            <>
              {Object.entries(viewInputs).map(([key, value]) => {
                const label = startCase(key);

                return (
                  <YStack
                    key={key}
                    gap={"$2"}
                  >
                    <Text fontSize={"$2"}>{label}</Text>
                    <Text
                      color={"$color11"}
                      fontSize={"$4"}
                    >
                      {value}
                    </Text>
                  </YStack>
                );
              })}
            </>
          )}
        </YStack>
      </CardWrapper>

      <Interests />
    </YStack>
  );
};

export default InfoTabContent;
